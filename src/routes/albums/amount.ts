import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	get: {
		handler: async (req: FastifyRequest, res: FastifyReply) => {
			const allAlbums = await req.db.album.findMany();
			res.send({ amount: allAlbums.length });
		},
	},
};
