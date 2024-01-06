import { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: async (req: FastifyRequest, res: FastifyReply) => {
			if (!req.userId) {
				res.code(401).send({ error: "Unauthorized" });
				return;
			}
			const user = await req.db.user.findUnique({ where: { id: req.userId } });
			if (!user) {
				res.code(404).send({ error: "User not found" });
				return;
			}
			res.send({
				name: user.name,
				id: user.id,
				permissions: user.permissions.split(" "),
			});
		},
	},
};
