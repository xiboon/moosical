import { FastifyRequest, FastifyReply } from "fastify";
import { join } from "path";
import { env } from "../../util/env.js";
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Querystring: { search: string; limit?: number } }>,
			res: FastifyReply,
		) => {
			const search = req.query.search;
			const limit = req.query.limit || 50;
			if (search.length > 100) {
				res.code(400).send({ error: "Search string too long" });
				return;
			}
			if (limit > 100) {
				res.code(400).send({ error: "Limit too high" });
				return;
			}
			if (!search) {
				res.code(400).send({ error: "No search string provided" });
				return;
			}
			const allSongs = await req.db.song.findMany({
				orderBy: {
					_relevance: {
						fields: ["title", "artistName"],
						search,
						sort: "desc",
					},
				},
				take: limit,
			});
			const songs = await Promise.all(
				allSongs.map((e) => req.transformers.transformSong(e)),
			);
			res.code(200).send(songs);
		},
	},
	post: {
		handler: async (req: FastifyRequest, res: FastifyReply) => {
			const songFile = await req.file();
			if (songFile?.type !== "file")
				return res.code(400).send({ error: "No file provided" });
			if (!songFile.mimetype.startsWith("audio/"))
				return res.code(400).send({ error: "Invalid file" });
			const song = await req.songIndexer.parseSongFromData(
				await songFile.toBuffer(),
				join(env.MUSIC_PATH, songFile.filename),
			);
			if (!song) return res.code(400).send({ error: "Invalid file" });
			const songData = await req.db.song.findFirst({ where: { id: song } });
			res.send(await req.transformers.transformSong(songData));
		},
	},
};
