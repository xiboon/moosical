import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../../util/env.js";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const song = await req.db.song.findUnique({
				where: { id: Number.parseInt(req.params.id) },
			});
			if (!song) return res.code(404).send({ error: "Song not found" });
			const artist = await req.db.artist.findUnique({
				where: { id: song.artistId },
			});
			const hash = crypto
				.createHash("sha1")
				.update(artist.name + song.title)
				.digest("hex");
			const coverPath = `${env.IMAGE_PATH}/${hash}.webp`;
			const file = await readFile(coverPath);
			if (!file) return res.code(404).send({ error: "Cover not found" });
			res.type("image/webp");
			return res.send(file);
		},
	},
};
