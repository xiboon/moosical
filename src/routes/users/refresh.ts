import { FastifyReply, FastifyRequest } from "fastify";
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
			const user = req.userId;
			if (!user) {
				res.status(404);
				res.send({ error: "User not found" });
				return;
			}
			const token = createSigner({
				key: process.env.JWT_SECRET,
				expiresIn: "7d",
			})({ userId: user });

			res.setCookie("token", token, {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
			});
		},
	},
};
