import type { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			console.log("uh");
			const dbSong = await req.db.song.findUnique({
				where: { id: Number.parseInt(req.params.id) },
			});
			if (!dbSong) return res.code(404).send({ error: "Song not found" });
			const artist = await req.db.artist.findUnique({
				where: { id: dbSong.artistId },
			});
			const lyrics = await req.lyricsProvider.findLyrics(
				artist.name,
				dbSong.title,
			);
			if (!lyrics) {
				res.code(404).send({ error: "Lyrics not found" });
				return;
			}
			res.code(200).send(lyrics);
		},
	},
};
