import { distance } from "fastest-levenshtein";
import { FastifyRequest } from "fastify";
import { Route } from "fastify-file-routes";

export const routes: Route = {
	get: {
		handler: async (
			req: FastifyRequest<{ Querystring: { search: string; limit?: string } }>,
			res,
		) => {
			const search = req.query.search;
			const limit = parseInt(req.query.limit) || 25;
			if (Number.isNaN(limit)) {
				res.code(400).send({ error: "Limit must be a number" });
				return;
			}
			const allArtists = await Promise.all(
				(await req.db.artist.findMany()).map(async (artist) => {
					return req.transformers.transformArtist(artist);
				}),
			);
			let sortedArtists = allArtists.map((artist) => {
				let distanceNum = 0;
				if (!artist.name.toLowerCase().startsWith(search.toLowerCase()))
					distanceNum = distance(search, artist.name) / artist.name.length;
				const songMatch = artist.songs.some((song) => {
					if (song.title.toLowerCase().startsWith(search.toLowerCase())) {
						distanceNum = distance(search, song.title) / song.title.length;
						return true;
					}
					return false;
				});
				if (songMatch) distanceNum = distanceNum / 2;
				const albumMatch = artist.albums.some((album) => {
					if (album.title.toLowerCase().startsWith(search.toLowerCase())) {
						distanceNum = distance(search, album.title) / album.title.length;
						return true;
					}
					return false;
				});
				if (albumMatch) distanceNum = distanceNum / 2;
				return { distance: distanceNum, artist };
			});
			sortedArtists = sortedArtists.sort((a, b) => a.distance - b.distance);
			res.send(sortedArtists.map((e) => e.artist));
		},
	},
};
