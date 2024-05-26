import type { FastifyReply, FastifyRequest } from "fastify";

import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { env } from "../../../util/env.js";
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			if (!req.params.id) {
				res.code(400).send({ error: "No id specified" });
				return;
			}
			const id = Number.parseInt(req.params.id);
			if (Number.isNaN(id)) {
				res.code(400).send({ error: "ID must be a number" });
				return;
			}
			const artist = await req.db.artist.findUnique({ where: { id } });
			if (!artist) {
				res.code(404).send({ error: "Album not found" });
				return;
			}
			const hash = crypto
				.createHash("sha1")
				.update(`${artist.name}`)
				.digest("hex");
			const coverPath = `${env.IMAGE_PATH}/artist_${hash}.jpg`;
			if (existsSync(coverPath)) {
				return res.type("image/jpeg").send(await readFile(coverPath));
			}
			let albumSearchResults = await req.songManager.discogs.search({
				artist: artist.name,
				type: "artist",
			});
			if (albumSearchResults.data.pagination.items === 0)
				albumSearchResults = await req.songManager.discogs.search({
					query: `${artist.name}`,
					type: "artist",
				});
			if (albumSearchResults.data.pagination.items === 0) {
				return res.code(404).send({ error: "Cover not found" });
			}
			const albumData = albumSearchResults.data.results[0];
			const cover = await fetch(albumData.cover_image);
			const coverBuffer = Buffer.from(await cover.arrayBuffer());
			await writeFile(coverPath, coverBuffer);
			return res.type("image/jpeg").send(coverBuffer);
		},
	},
};
