import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { createSigner } from "fast-jwt";
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
				key: process.env.JWT_SECRET,
			})({ userId: user.id });
			res.setCookie("token", token, {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
			});
		},
	},
};
