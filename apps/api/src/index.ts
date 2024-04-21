import { join } from "path";
import fastifyAuth from "@fastify/auth";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { fastifyMultipart } from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { createVerifier } from "fast-jwt";
import { fastify } from "fastify";
import { mkdir } from "fs/promises";
import { env } from "./util/env.js";

import { cpus } from "os";
import sharp from "sharp";
import { LyricsProvider } from "./classes/LyricsProvider.js";
import { SongIndexer } from "./classes/SongIndexer.js";
import { SongManager } from "./classes/SongManager.js";
import { Transformers } from "./classes/Transformers.js";
import { routesPlugin } from "./util/loadRoutes.js";
import { permissions } from "./util/permissions.js";
sharp.concurrency(cpus().length - 1);
const mainDir = import.meta.url
	.replace("file://", "")
	.split("/")
	.slice(0, -1)
	.join("/");

await mkdir(env.IMAGE_PATH).catch(() => {});
await mkdir(env.LYRICS_PATH).catch(() => {});

const app = fastify();
const db = new PrismaClient();
const songManager = new SongManager(db);
const songIndexer = new SongIndexer(
	db,
	songManager,
	process.env.MUSIC_PATH.split(";"),
);
const transformers = new Transformers(db);
const lyricsProvider = new LyricsProvider();

app.register(cookie);
app.register(fastifyAuth);
app.register(fastifyMultipart, {
	limits: { fileSize: 1024 * 1024 * 1024 * 100, files: 1, fields: 0 },
});
app.register(cors, {
	origin: process.env.CORS_ORIGIN,
	credentials: true,
});
app.register(routesPlugin, { path: join(mainDir, "routes") });

const verifier = createVerifier({
	key: process.env.JWT_SECRET,
	algorithms: ["HS256"],
	cache: true,
});

app.decorateRequest("songIndexer");
app.decorateRequest("jwtVerifier");
app.decorateRequest("songManager");
app.decorateRequest("lyricsProvider");
app.decorateRequest("transformers");
app.decorateRequest("db");

app.addHook("onRequest", (req, _res, done) => {
	req.jwtVerifier = verifier;
	req.db = db;
	req.songIndexer = songIndexer;
	req.songManager = songManager;
	req.lyricsProvider = lyricsProvider;
	req.transformers = transformers;
	done();
});

await db.user.upsert({
	where: { id: 1 },
	update: {},
	create: {
		name: "root",
		permissions: permissions,
		password: await bcrypt.hash(process.env.ROOT_PASSWORD || "root", 12),
	},
});

app.listen({ port: parseInt(process.env.PORT) }, () => {
	songIndexer.indexSongs();
	console.log(`Server is running on port ${process.env.PORT}`);
	console.log("h");
});
