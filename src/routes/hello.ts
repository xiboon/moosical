import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: (req: FastifyRequest, res: FastifyReply) =>
			res.send("Hello, world!"),
	},
};
