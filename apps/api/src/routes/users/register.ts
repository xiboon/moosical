import bcrypt from "bcrypt";
import { createSigner } from "fast-jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
export const routes = {
	post: {
		handler: async (
			req: FastifyRequest<{
				Body: { name: string; password: string };
			}>,
			res: FastifyReply,
		) => {
			let jwt = false;
			const { name, password } = req.body;
			const exists = await req.db.user.findUnique({
				where: { name },
			});
			if (process.env.ENABLE_REGISTERING?.toLowerCase() !== "true") {
				const cookies = req.cookies;
				if (!cookies || !cookies.token) {
					res.status(403);
					res.send({ error: "Forbidden" });
					return;
				}
				const token = cookies.token;
				try {
					const decoded = req.jwtVerifier(token);
					req.userId = decoded.userId;
					const user = await req.db.user.findUnique({
						where: { id: decoded.userId },
					});
					if (!user) {
						res.status(403);
						res.send({ error: "Forbidden" });
						return;
					}
					if (!user.permissions.includes("MANAGE_USERS")) {
						res.status(403);
						res.send({ error: "Forbidden" });
						return;
					}
					jwt = true;
				} catch (e) {
					res.status(403);
					res.send({ error: "Forbidden" });
					return;
				}
			}
			if (exists) {
				res.status(400);
				res.send({ error: "User with that username already exists" });
				return;
			}
			const hashedPassword = await bcrypt.hash(password, 12);
			const user = await req.db.user.create({
				data: {
					name,
					password: hashedPassword,
				},
			});
			if (!jwt)
				res.setCookie(
					"token",
					createSigner({ algorithm: "HS256", key: process.env.JWT_SECRET })({
						id: user.id,
					}),
					{
						httpOnly: true,
						sameSite: "strict",
					},
				);
			res.send({ name: { name: user.name, id: user.id } });
		},
	},
};
