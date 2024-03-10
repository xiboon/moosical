import { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	post: {
		handler: async (
			req: FastifyRequest<{ Body: { songs: string[] } }>,
			res: FastifyReply,
		) => {
			if (
				!req.body.songs ||
				req.body.songs.length === 0 ||
				!Array.isArray(req.body.songs)
			) {
				res.status(400);
				res.send({ error: "No songs provided" });
				return;
			}
			const songs = req.body.songs;
			const allSongs = await req.db.song.findMany();
			try {
				const bestMatches = songs.map(async (song) => {
					const bestMatch = await req.db.song.findMany({
						orderBy: {
							_relevance: {
								fields: ["artistName"],
								search: "epic test",
								sort: "asc",
							},
						},
					});
					return bestMatch[0];
				});
			} catch (e) {
				console.log(e);
			}
			const bestMatchesArray = await Promise.all(bestMatches);
			const playlist = await req.db.playlist.create({
				data: {
					title: "Imported Playlist",
					description: "This playlist was imported from a text file",
					userId: req.userId,
					public: false,
				},
			});
			await req.db.playlistPosition.createMany({
				data: bestMatchesArray
					.filter((e, i) => bestMatchesArray.indexOf(e) === i)
					.map((e, i) => ({
						playlistId: playlist.id,
						songId: e.id,
						position: i,
					})),
			});
			res.send(await req.transformers.transformPlaylist(playlist, false));
		},
	},
};
