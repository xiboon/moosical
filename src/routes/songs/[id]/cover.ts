import { FastifyRequest, FastifyReply } from "fastify";

import { readFile } from "fs/promises";
import crypto from "crypto";
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const song = await req.db.song.findUnique({
				where: { id: parseInt(req.params.id) },
			});
			if (!song) return res.code(404).send({ error: "Song not found" });
			const artist = await req.db.artist.findUnique({
				where: { id: song.artistId },
			});
			const hash = crypto
				.createHash("sha1")
				.update(artist.name + song.title)
				.digest("hex");
			const coverPath = `${req.coverPath}/${hash}.${song.coverArtFormat}`;
			const file = await readFile(coverPath);
			res.type(`image/${song.coverArtFormat}`);
			return res.send(file);
		},
	},
};
