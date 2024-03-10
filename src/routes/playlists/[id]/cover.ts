import { FastifyRequest, FastifyReply } from "fastify";
import { readFile, writeFile } from "fs/promises";
import crypto from "crypto";
import { env } from "../../../util/env.js";
import { Canvas, loadImage } from "@napi-rs/canvas";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const playlist = await req.db.playlist.findUnique({
				where: { id: parseInt(req.params.id) },
			});
			if (!playlist) return res.code(404).send({ error: "Playlist not found" });
			const user = await req.db.user.findUnique({
				where: { id: playlist.userId },
			});
			const hash = crypto
				.createHash("sha1")
				.update(user.name + playlist.title)
				.digest("hex");

			const coverPath = `${env.IMAGE_PATH}/${hash}.webp`;
			const file = await readFile(coverPath).catch((e) => null);

			if (!file) {
				const playlistSongs = await req.db.playlistPosition.findMany({
					where: {
						playlistId: playlist.id,
					},
				});
				const songIds = playlistSongs.map((e) => e.songId).slice(0, 4);

				const songs = await req.db.song.findMany({
					where: {
						id: {
							in: songIds,
						},
					},
				});

				if (songs.length < 4)
					return res.code(404).send({ error: "Cover not found" });

				const covers = await Promise.all(
					songs.map(async (e) => {
						const artist = await req.db.artist.findUnique({
							where: { id: e.artistId },
						});
						const hash = crypto
							.createHash("sha1")
							.update(artist.name + e.title)
							.digest("hex");
						const coverPath = `${env.IMAGE_PATH}/${hash}.webp`;
						return coverPath;
					}),
				);

				const canvas = new Canvas(1024, 1024);
				const ctx = canvas.getContext("2d");

				for (let i = 0; i < covers.length; i++) {
					const cover = covers[i];
					const img = await loadImage(cover);
					ctx.drawImage(img, (i % 2) * 512, Math.floor(i / 2) * 512, 256, 256);
				}
				const buffer = await canvas.toBuffer("image/webp");
				await writeFile(coverPath, buffer);
				res.type("image/webp");
				return res.send(buffer);
			}
			res.type("image/webp");
			return res.send(file);
		},
	},
};
