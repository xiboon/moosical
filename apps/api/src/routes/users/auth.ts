import bcrypt from "bcrypt";
import { createSigner } from "fast-jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../util/env";
export const routes = {
	post: {
		handler: async (
			req: FastifyRequest<{
				Body: {
					name: string;
					password: string;
				};
			}>,
			res: FastifyReply,
		) => {
			const user = await req.db.user.findUnique({
				where: { name: req.body.name },
			});
			if (!user) {
				res.status(404);
				res.send({ error: "User not found" });
				return;
			}
			const match = await bcrypt.compare(req.body.password, user.password);
			if (!match) {
				res.status(401);
				res.send({ error: "Incorrect password" });
				return;
			}
			const token = createSigner({
				key: env.JWT_SECRET,
			})({ userId: user.id });
			res.setCookie("token", token, {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
			});
		},
	},
};
