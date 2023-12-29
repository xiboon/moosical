import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { fastify } from "fastify";
import { fileRoutes } from "fastify-file-routes";
import { join } from "path";
import { SongManager } from "./managers/SongManager.js";
import { SongIndexer } from "./managers/SongIndexer.js";
import { mkdir } from "fs/promises";
import { LyricsProvider } from "./managers/LyricsProvider.js";
import { Transformers } from "./managers/Transformers.js";

const mainDir = import.meta.url
	.replace("file://", "")
	.split("/")
	.slice(0, -1)
	.join("/");

// TODO: provide better support for paths (this doesn't work with non-relative paths)
const coverPath = join(`${mainDir}/..`, process.env.COVER_PATH);
const lyricPath = join(`${mainDir}/..`, process.env.LYRICS_PATH);
const musicPaths = process.env.MUSIC_PATH.startsWith("/")
	? process.env.MUSIC_PATH
	: join(`${mainDir}/..`, process.env.MUSIC_PATH);

await mkdir(coverPath).catch((e) => {});

const app = fastify();
const db = new PrismaClient();
const songManager = new SongManager(db);
const songIndexer = new SongIndexer(
	db,
	songManager,
	process.env.MUSIC_PATH.split(";"),
	coverPath,
);
const transformers = new Transformers(db);
const lyricsProvider = new LyricsProvider(lyricPath);
app.decorateRequest("songManager");
app.decorateRequest("lyricsProvider");
app.decorateRequest("musicPath");
app.decorateRequest("transformers");
app.decorateRequest("db", null);
app.addHook("onRequest", (req, res, done) => {
	req.db = db;
	req.songManager = songManager;
	req.lyricsProvider = lyricsProvider;
	req.musicPath = musicPaths;
	req.transformers = transformers;
	done();
});
app.register(fileRoutes, { routesDir: join(mainDir, "routes") });
songIndexer.indexSongs().then(() => {
	app.listen({ port: parseInt(process.env.PORT) }, () => {
		console.log(`Server is running on port ${process.env.PORT}`);
	});
});
