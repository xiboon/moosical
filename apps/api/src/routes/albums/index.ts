import type { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Querystring: { search: string; limit?: string } }>,
			res: FastifyReply,
		) => {
			const limit = Number.parseInt(req.query.limit) || 25;
			const search = req.query.search;
			if (search.length > 50) {
				res.code(400).send({ error: "Search string too long" });
				return;
			}

			if (Number.isNaN(limit)) {
				res.code(400).send({ error: "Limit must be a number" });
				return;
			}
			const rawAlbums = await req.db.album.findMany({
				orderBy: {
					_relevance: {
						fields: ["title"],
						search,
						sort: "desc",
					},
				},
				take: limit,
			});

			const albums = await Promise.all(
				rawAlbums.map((e) => req.transformers.transformAlbum(e)),
			);
			res.code(200).send(albums);
		},
	},
};
