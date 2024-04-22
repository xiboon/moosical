import type { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: (_req: FastifyRequest, res: FastifyReply) =>
			res.send("Hello, world!"),
	},
};
