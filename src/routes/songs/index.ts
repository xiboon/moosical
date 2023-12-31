import { distance } from "fastest-levenshtein";
import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Querystring: { search: string; limit?: number } }>,
			res,
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
};
