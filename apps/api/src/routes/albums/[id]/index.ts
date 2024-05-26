import type { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			if (!req.params.id) {
				res.code(400).send({ error: "No id specified" });
				return;
			}
			const id = Number.parseInt(req.params.id);
			if (Number.isNaN(id)) {
				res.code(400).send({ error: "ID must be a number" });
				return;
			}
			const album = await req.db.album.findUnique({ where: { id } });
			if (!album) {
				res.code(404).send({ error: "Album not found" });
				return;
			}
			const transformedAlbum = await req.transformers.transformAlbum(album);
			res.code(200).send(transformedAlbum);
		},
	},
};
