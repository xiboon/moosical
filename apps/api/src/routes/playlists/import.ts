import { closest } from "fastest-levenshtein";
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
			const songs = req.body.songs.map((e) => e.split("-"));
			const allSongs = await req.db.song.findMany({});
			const titleToId = new Map();
			let i = 0;
			for (const song of allSongs) {
				titleToId.set(song.artistName + song.title, {
					id: song.id,
					position: i,
				});
				i++;
			}
			const songTitles = new Set(allSongs.map((e) => e.artistName + e.title));
			const bestMatches = songs.map((song) => {
				const closestSong = closest(song[0] + song[1], [...songTitles]);
				songTitles.delete(closestSong);
				return closestSong;
			});
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
					.map((e) => ({
						playlistId: playlist.id,
						songId: titleToId.get(e).id,
						position: titleToId.get(e).index,
					})),
			});
			res.send(await req.transformers.transformPlaylist(playlist, false));
		},
	},
};
