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
			if (!song) return res.code(404).send({ error: "Song not found" });
			res.code(200).send(await req.transformers.transformSong(song));
		},
	},
};
