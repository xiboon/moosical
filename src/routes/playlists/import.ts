import { distance } from "fastest-levenshtein";
import { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
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
			const songs = req.body.songs.map((e) => ({
				artist: e.split(" - ")[0],
				title: e.split(" - ")[1],
			}));
			const allSongs = await req.db.song.findMany();
			const bestMatches = songs.map(async (song) => {
				let lowestDistance = 100;
				const distanceMap = allSongs.map(async (e) => {
					let distanceNum = 0;
					// if the song doesn't start with the search string calculate the distance
					distanceNum = distance(song.title, e.title) / e.title.length;
					if (lowestDistance < distanceNum) return;
					// if the artist doesn't start with the search string calculate the distance
					const artist = await req.db.artist.findUnique({
						where: { id: e.artistId },
					});

					if (song.artist.toLowerCase() !== artist.name.toLowerCase())
						distanceNum = distanceNum * 1.5;

					if (distanceNum < lowestDistance) lowestDistance = distanceNum;

					return {
						distance: distanceNum,
						song: e,
					};
				});
				const sortedSongs = (await Promise.all(distanceMap))
					.filter((e) => e !== undefined)
					.sort((a, b) => a.distance - b.distance);
				if (sortedSongs.length === 0) return;
				const bestMatch = sortedSongs[0].song;
				return bestMatch;
			});
			const bestMatchesArray = await Promise.all(bestMatches);
			const playlist = await req.db.playlist.create({
				data: {
					title: "Imported Playlist",
					description: "This playlist was imported from a text file",
					songIds: bestMatchesArray.map((e) => e.id).join(" "),
				},
			});
			res.send(await req.transformers.transformPlaylist(playlist, false));
		},
	},
};
