import { FastifyRequest } from "fastify";
import { Route } from "fastify-file-routes";

export const routes: Route = {
	get: {
		handler: async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
			const id = parseInt(req.params.id);
			const artist = await req.db.artist.findUnique({ where: { id } });
			if (!artist) {
				res.code(404).send({ error: "Artist not found" });
				return;
			}
			res.send(await req.transformers.transformArtist(artist));
		},
	},
};
