import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const song = await req.db.song.findUnique({
				where: { id: parseInt(req.params.id) },
			});
			if (!song) return res.code(404).send({ error: "Song not found" });
			await req.db.stream.create({
				data: {
					artistId: song.artistId,
					songId: song.id,
					userId: req.userId,
				},
			});
			res.code(201);
		},
	},
};
