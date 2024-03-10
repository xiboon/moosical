import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Querystring: { search: string; limit?: string } }>,
			res: FastifyReply,
		) => {
			const search = req.query.search;
			const limit = parseInt(req.query.limit) || 25;
			if (Number.isNaN(limit)) {
				res.code(400).send({ error: "Limit must be a number" });
				return;
			}
			const allArtists = await req.db.artist.findMany({
				orderBy: {
					_relevance: {
						fields: ["name"],
						search,
						sort: "asc",
					},
				},
				take: limit,
			});
			res.send(
				await Promise.all(
					allArtists.map((e) => req.transformers.transformArtist(e, false)),
				),
			);
		},
	},
};
