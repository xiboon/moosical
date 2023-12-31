import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { fastify } from "fastify";
// import { fileRoutes } from "fastify-file-routes";
import { join } from "path";
import { SongManager } from "./classes/SongManager.js";
import { SongIndexer } from "./classes/SongIndexer.js";
import { mkdir } from "fs/promises";
import { LyricsProvider } from "./classes/LyricsProvider.js";
import { Transformers } from "./classes/Transformers.js";
import { plugin } from "./util/loadRoutes.js";

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

app.register(plugin, { path: join(mainDir, "routes") });

app.decorateRequest("songManager");
app.decorateRequest("lyricsProvider");
app.decorateRequest("coverPath");
app.decorateRequest("musicPath");
app.decorateRequest("transformers");
app.decorateRequest("db", null);

app.addHook("onRequest", (req, res, done) => {
	req.db = db;
	req.songManager = songManager;
	req.lyricsProvider = lyricsProvider;
	req.musicPath = musicPaths;
	req.coverPath = coverPath;
	req.transformers = transformers;
	done();
});

await db.user.upsert({
	where: { id: 1 },
	update: {},
	create: {
		name: "root",
		permissions: 8,
		password: process.env.ROOT_PASSWORD || "root",
	},
});

// app.register(fileRoutes, {
// 	dir: join(mainDir, "routes"),
// 	logLevel: "info",
// });
// loadRoutes(join(mainDir, "routes"), app);
console.log(performance.now());
songIndexer.indexSongs().then(() => {
	app.listen({ port: parseInt(process.env.PORT) }, () => {
		console.log(`Server is running on port ${process.env.PORT}`);
	});
});
