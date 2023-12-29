import { FastifyRequest } from "fastify";
import { Route } from "fastify-file-routes";

export const routes: Route = {
	get: {
		handler: async (req: FastifyRequest<{ Params: { ids: string } }>, res) => {
			const ids = req.params.ids.split(",").map((e) => parseInt(e));
			if (ids.some((e) => Number.isNaN(e)))
				return res.code(400).send({ error: "Invalid IDs" });
			const songs = await Promise.all(
				(
					await req.db.song.findMany({
						where: { id: { in: ids } },
					})
				).map((e) => req.transformers.transformSong(e)),
			);
			res.code(200).send(songs);
		},
	},
};
