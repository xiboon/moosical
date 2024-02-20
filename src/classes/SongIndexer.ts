import { PrismaClient } from "@prisma/client";
import { Path, glob } from "glob";
import { parseBuffer, parseFile } from "music-metadata";
import { SongManager } from "./SongManager";
import crypto from "crypto";
import { appendFile, readFile, rename, writeFile } from "fs/promises";
import { existsSync } from "fs";
import sharp from "sharp";
import mime from "mime";

export class SongIndexer {
	finishedAlbums: string[] = [];
	constructor(
		private db: PrismaClient,
		private manager: SongManager,
		private songPaths: string[],
		private coverPath: string,
		private lyricPath: string,
	) {}

	async indexSongs() {
		console.log("Starting indexing");
		const songPaths = await glob(`${this.songPaths[0]}/**/*`, {
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

	async parseSongFromData(data: Buffer, filename?: string) {
		const metadata = await parseBuffer(data);
		if (metadata.common.picture) {
			const cover = metadata.common.picture[0];
			const data = await sharp(cover.data).resize(512, 512).webp().toBuffer();
			const hash = crypto
				.createHash("sha1")
				.update(metadata.common.artist + metadata.common.title)
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
			artist: metadata.common.artists[0],
			featuredArtists: metadata.common.artists.slice(1),
			album: metadata.common.album,
			duration: metadata.format.duration,
			filename:
				filename ||
				`${metadata.common.title} - ${metadata.common.artist}.${metadata.format.container}`,
		});
	}

	async parseSongFromPath(path: Path) {
		if (path.isDirectory()) return;
		const mimeType = mime.getType(path.name);
		if (!mimeType?.includes("audio")) return;

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
			if (
				!metadata.common.title ||
				!metadata.common.artist ||
				!metadata.common.album ||
				!metadata.format.duration ||
				!metadata.common.artists[0]
			) {
				console.log("Invalid file metadata:", path.fullpath());
				return;
			}

			const hash = crypto
				.createHash("sha1")
				.update(metadata.common.artist + metadata.common.title)
				.digest("hex");

			if (metadata.common.picture) {
				const cover = metadata.common.picture[0];
				const coverPath = `${this.coverPath}/${hash}.webp`;
				const data = await sharp(cover.data)
					.resize(512, 512)
					.webp()
					.toFile(coverPath);
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
				artist: metadata.common.artist || metadata.common.artists[0],
				featuredArtists: metadata.common.artists.slice(1),
				album: metadata.common.album,
				duration: metadata.format.duration,
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
