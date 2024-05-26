import type { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const id = Number.parseInt(req.params.id);
			const artist = await req.db.artist.findUnique({ where: { id } });
			if (!artist) {
				res.code(404).send({ error: "Artist not found" });
				return;
			}
			res.send(await req.transformers.transformArtist(artist));
		},
	},
};
