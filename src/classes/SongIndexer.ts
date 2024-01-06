import { PrismaClient } from "@prisma/client";
import { Path, glob } from "glob";
import { parseBuffer, parseFile } from "music-metadata";
import { SongManager } from "./SongManager";
import crypto from "crypto";
import { appendFile, writeFile } from "fs/promises";
export class SongIndexer {
	finishedAlbums: string[] = [];
	constructor(
		private db: PrismaClient,
		private manager: SongManager,
		private songPaths: string[],
		private coverPath: string,
	) {}

	async indexSongs() {
		console.log("Starting indexing");
		Promise.all(
			this.songPaths.map(async (path) => {
				const songs = await glob(`${path}/*`, { withFileTypes: true });

				const startingPromise = Promise.resolve(null);

				return songs.reduce((p, song) => {
					return p.then((e) => {
						return this.parseSongFromPath(song);
					});
				}, startingPromise);
			}),
		).then(() => {
			console.log(performance.now());
			console.log("Done with indexing!");
		});
	}
	// TODO: yell at the user if song isn't tagged properly
	async parseSongFromData(data: Buffer, existsInFolder = true, path?: Path) {
		const metadata = await parseBuffer(data);
		if (metadata.common.picture) {
			const cover = metadata.common.picture[0];
			const hash = crypto
				.createHash("sha1")
				.update(metadata.common.artist + metadata.common.title)
				.digest("hex");
			const coverPath = `${this.coverPath}/${hash}.${
				cover.format.split("/")[1]
			}`;
			await appendFile(coverPath, cover.data);
		}
		if (!existsInFolder) {
			writeFile(
				`${metadata.common.title} - ${metadata.common.artist}.${metadata.format.container}`,
				data,
			);
		}
		return this.manager.addSongToDB({
			title: metadata.common.title,
			artist: metadata.common.artists[0],
			featuredArtists: metadata.common.artists.slice(1),
			album: metadata.common.album,
			duration: metadata.format.duration,
			filename:
				path.fullpath() ||
				`${metadata.common.title} - ${metadata.common.artist}.${metadata.format.container}`,
			coverArtFormat: metadata.common.picture[0]?.format.split("/")[1],
		});
	}
	async parseSongFromPath(path: Path) {
		const exists = await this.db.song.findMany({
			where: { filename: path.fullpath() },
		});
		if (exists.length !== 0) {
			return;
		}
		if (path.name.split(".").includes("transcoded")) return;

		const metadata = await parseFile(path.fullpath());
	}
}
