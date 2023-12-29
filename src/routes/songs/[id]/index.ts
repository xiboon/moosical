import { FastifyRequest } from "fastify";
import { Route } from "fastify-file-routes";

export const routes: Route = {
	get: {
		handler: async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
			const song = await req.db.song.findUnique({
				where: { id: parseInt(req.params.id) },
			});
			if (!song) return res.code(404).send({ error: "Song not found" });
			res.code(200).send(await req.transformers.transformSong(song));
		},
	},
};
