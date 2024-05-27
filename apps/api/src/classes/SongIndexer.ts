import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, readFile, rename, writeFile } from "node:fs/promises";
import type { PrismaClient } from "@prisma/client";
import { type Path, glob } from "glob";
import mime from "mime";
import { parseBuffer, parseFile } from "music-metadata";
import sharp from "sharp";
import { env } from "../util/env.js";
import type { SongManager } from "./SongManager.js";

export class SongIndexer {
	finishedAlbums: string[] = [];
	coverPath: string;
	lyricPath: string;
	constructor(
		private db: PrismaClient,
		private manager: SongManager,
		private songPath: string,
	) {
		this.coverPath = env.IMAGE_PATH;
		this.lyricPath = env.LYRICS_PATH;
	}

	async indexSongs() {
		console.log("Starting indexing");
		const songPaths = await glob(`${this.songPath}/**/*`, {
			withFileTypes: true,
		});
		const promise = songPaths.map(async (e) => {
			return this.parseSongFromPath(e);
		});
		Promise.all(promise).then(() =>
			console.log("Finished indexing", performance.now()),
		);
		const songs = await this.db.song.findMany();
		songs.forEach((e) => {
			const fileExists = existsSync(e.filename);
			if (!fileExists) {
				this.db.song.delete({ where: { id: e.id } });
			}
		});
	}
	// make the two functions below do the same exact thing
	async parseSongFromData(data: Buffer, filename?: string) {
		const metadata = await parseBuffer(data);
		const artists = metadata.common.artist.split(', ');
		if (metadata.common.picture) {
			const cover = metadata.common.picture[0];
			const data = await sharp(cover.data).resize(512, 512).webp().toBuffer();
			const hash = crypto
				.createHash("sha1")
				.update(artists[0] + metadata.common.title)
				.digest("hex");
			const coverPath = `${this.coverPath}/${hash}.webp`;
			await appendFile(coverPath, data);
		}
		writeFile(
			filename ||
			`${metadata.common.title} - ${metadata.common.artist}.${metadata.format.container}`,
			data,
		);
		return this.manager.addSongToDB({
			title: metadata.common.title,
			artist: artists[0],
			featuredArtists: artists.slice(1),
			album: metadata.common.album,
			position: metadata.common.track.no,
			duration: metadata.format.duration,
			filename:
				filename ||
				`${metadata.common.title} - ${artists[0]}.${metadata.format.container}`,
		});
	}

	async parseSongFromPath(path: Path) {
		if (path.isDirectory()) return;
		const mimeType = mime.getType(path.name);
		if (!mimeType?.includes("audio")) {
			return;
		}

		const split = path.name.split(".");
		if (split.at(-2).includes("transcoded")) return;

		const exists = await this.db.song.findMany({
			where: { filename: path.fullpath() },
		});

		if (exists.length !== 0) {
			return;
		}

		try {
			const metadata = await parseFile(path.fullpath());
			const artists = metadata.common.artist.split(', ');
			if (
				!metadata.common.title ||
				!metadata.common.artist ||
				!metadata.common.album ||
				!metadata.format.duration ||
				!artists[0]
			) {
				console.log("Invalid file metadata:", path.fullpath());
				return;
			}

			const hash = crypto
				.createHash("sha1")
				.update(artists[0] + metadata.common.title)
				.digest("hex");

			if (metadata.common.picture) {
				const cover = metadata.common.picture[0];
				const coverPath = `${this.coverPath}/${hash}.webp`;
				await sharp(cover.data).resize(512, 512).webp().toFile(coverPath);
			}
			const lrcFile = `${path
				.fullpath()
				.split(".")
				.slice(0, -1)
				.join(".")}.lrc`;
			const lrcExists = existsSync(lrcFile);
			if (metadata.common.lyrics || lrcExists) {
				const lyricPath = `${this.lyricPath}/${hash}.lrc`;
				await writeFile(
					lyricPath,
					metadata.common.lyrics || (await readFile(lrcFile, "utf-8")),
				);
			}

			return this.manager.addSongToDB({
				title: metadata.common.title,
				artist: artists[0],
				featuredArtists: artists.slice(1),
				album: metadata.common.album,
				duration: metadata.format.duration,
				position: metadata.common.track.no,
				filename: path.fullpath(),
			});
		} catch (e) {
			console.log("Broken file found:", path.fullpath());
			console.log("Adding .broken to filename, fix or delete the file");
			const newPath = `${path.fullpath()}.broken`;
			await rename(path.fullpath(), newPath);
		}
	}
}
