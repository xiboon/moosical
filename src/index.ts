import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fastify } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { createVerifier } from "fast-jwt";
import { join } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { fastifyMultipart } from "@fastify/multipart";
import fastifyAuth from "@fastify/auth";

import { SongManager } from "./classes/SongManager.js";
import { SongIndexer } from "./classes/SongIndexer.js";
import { LyricsProvider } from "./classes/LyricsProvider.js";
import { Transformers } from "./classes/Transformers.js";
import { plugin } from "./util/loadRoutes.js";
import { permissions } from "./util/permissions.js";
import sharp from "sharp";
import { cpus } from "os";
sharp.concurrency(cpus().length - 1);
const mainDir = import.meta.url
	.replace("file://", "")
	.split("/")
	.slice(0, -1)
	.join("/");

// TODO: provide better support for paths (this doesn't work with non-relative paths)
const imagePath = join(`${mainDir}/..`, process.env.IMAGE_PATH);
const lyricPath = join(`${mainDir}/..`, process.env.LYRICS_PATH);
const musicPaths = process.env.MUSIC_PATH.startsWith("/")
	? process.env.MUSIC_PATH
	: join(`${mainDir}/..`, process.env.MUSIC_PATH);

await mkdir(imagePath).catch((e) => {});
await mkdir(lyricPath).catch((e) => {});

const app = fastify();
const db = new PrismaClient();
const songManager = new SongManager(db);
const songIndexer = new SongIndexer(
	db,
	songManager,
	process.env.MUSIC_PATH.split(";"),
	imagePath,
	lyricPath,
);
const transformers = new Transformers(db);
const lyricsProvider = new LyricsProvider(lyricPath);

// get jwt secret and if it doesn't exist, create one
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
	const secret = crypto.randomBytes(64).toString("hex");
	let envFile = await readFile(join(mainDir, "..", ".env"), "utf-8");
	envFile =
		envFile.indexOf("JWT_SECRET=") === -1
			? envFile + `\nJWT_SECRET="${secret}"`
			: envFile.replace(/JWT_SECRET=.*/, `JWT_SECRET="${secret}"`);
	await writeFile(join(mainDir, "..", ".env"), envFile);
	process.env.JWT_SECRET = secret;
}

app.register(cookie);
app.register(fastifyMultipart, {
	limits: { fileSize: 1024 * 1024 * 1024 * 100, files: 1, fields: 0 },
});
app.register(fastifyAuth);
app.register(cors, {
	origin: process.env.CORS_ORIGIN,
	credentials: true,
});
app.register(plugin, { path: join(mainDir, "routes") });

const verifier = createVerifier({
	key: process.env.JWT_SECRET,
	algorithms: ["HS256"],
	cache: true,
});

app.decorateRequest("songIndexer");
app.decorateRequest("jwtVerifier");
app.decorateRequest("songManager");
app.decorateRequest("lyricsProvider");
app.decorateRequest("imagePath");
app.decorateRequest("musicPath");
app.decorateRequest("transformers");
app.decorateRequest("db");

app.addHook("onRequest", (req, res, done) => {
	req.jwtVerifier = verifier;
	req.db = db;
	req.songIndexer = songIndexer;
	req.songManager = songManager;
	req.lyricsProvider = lyricsProvider;
	req.musicPath = musicPaths;
	req.imagePath = imagePath;
	req.transformers = transformers;
	done();
});

await db.user.upsert({
	where: { id: 1 },
	update: {},
	create: {
		name: "root",
		permissions: permissions.join(" "),
		password: await bcrypt.hash(process.env.ROOT_PASSWORD || "root", 12),
	},
});

songIndexer.indexSongs().then(() => {
	app.listen({ port: parseInt(process.env.PORT) }, () => {
		console.log(`Server is running on port ${process.env.PORT}`);
	});
	console.log(sharp.simd(), "simd");
	console.log(sharp.concurrency(), "concurrency");
});
