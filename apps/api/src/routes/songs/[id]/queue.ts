import type { Song } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const song = await req.db.song.findUnique({
				where: { id: Number.parseInt(req.params.id) },
			});
			const streams = await req.db.stream.findMany({
				where: {
					userId: req.userId,
				},
			});
			const songsArtistFeaturedOn = await req.db.song.findMany({
				where: {
					featuredArtistsIds: {
						has: song.artistId,
					},
				},
			});

			const streamIds = streams.map((e) => e.songId);
			const featuredIds = songsArtistFeaturedOn.map((e) => e.id);

			const allSongs: (Song & { weight?: number })[] =
				await req.db.song.findMany();

			allSongs.map((e) => {
				let weight = 1;
				if (streamIds.includes(e.id)) {
					weight *= 2;
				}
				if (featuredIds.includes(e.id)) {
					weight *= 2 / e.featuredArtistsIds.length;
				}
				e.weight = weight;
				const array = [];
				for (let i = 0; i < weight; i++) {
					array.push(e);
				}
				return array;
			});

			const songs = allSongs
				.flat()
				.sort(() => Math.random() - 0.5)
				.map((e) => e.id);
			res.send(songs.slice(0, 50));
		},
	},
};
