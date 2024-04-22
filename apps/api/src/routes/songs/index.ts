import { join } from "node:path";
import { distance } from "fastest-levenshtein";
import type { FastifyReply, FastifyRequest } from "fastify";
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
			const allSongs = await req.db.song.findMany();
			const songByListens = allSongs.sort((a, b) => b.listens - a.listens);
			const songTitles = (
				await Promise.all(
					allSongs.map(async (song, i) => {
						const artist = await req.db.artist.findUnique({
							where: { id: song.artistId },
						});
						let distanceNum = 0;
						// if the song doesn't start with the search string calculate the distance
						if (!song.title.toLowerCase().startsWith(search.toLowerCase()))
							distanceNum = distance(search, song.title) / song.title.length;
						// make songs with more listens higher up
						distanceNum = distanceNum / (songByListens.indexOf(song) + 1);

						// make songs with the artist name starting with the search string higher up
						if (artist.name.toLowerCase().startsWith(search.toLowerCase()))
							distanceNum = distanceNum / 2;
						return {
							distance: distanceNum,
							title: song.title,
							index: i,
						};
					}),
				)
			).sort((a, b) => a.distance - b.distance);

			const songs = await Promise.all(
				songTitles
					.slice(0, limit)
					.map((e) => req.transformers.transformSong(allSongs[e.index])),
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
