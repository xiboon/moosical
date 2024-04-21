import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	get: {
		handler: async (req: FastifyRequest, res: FastifyReply) => {
			const allSongs = await req.db.song.findMany();
			res.send({ amount: allSongs.length });
		},
	},
};
