import bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { type Permissions, permissions } from "../../../util/permissions.js";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const user = await req.db.user.findUnique({
				where: {
					id:
						req.params.id === "me"
							? req.userId
							: Number.parseInt(req.params.id),
				},
			});
			if (!user) {
				res.status(404);
				res.send({ error: "User not found" });
				return;
			}
			const playlists = await req.db.playlist.findMany({
				where: {
					userId: user.id,
				},
			});
			res.send({
				name: user.name,
				id: user.id,
				playlists: await Promise.all(
					playlists.map((e) => req.transformers.transformPlaylist(e, false)),
				),
			});
		},
	},
	patch: {
		handler: async (
			req: FastifyRequest<{
				Body: { name?: string; password?: string; permissions?: Permissions };
				Params: { id: string };
			}>,
			res: FastifyReply,
		) => {
			const requestUser = await req.db.user.findUnique({
				where: { id: req.userId },
			});
			const manageUsers = requestUser?.permissions.includes("MANAGE_USERS");

			if (req.userId !== Number.parseInt(req.params.id) && !manageUsers) {
				res.code(403).send({ error: "Forbidden" });
				return;
			}

			const user = await req.db.user.findUnique({
				where: { id: Number.parseInt(req.params.id) },
			});

			if (!user) {
				res.status(404);
				res.send({ error: "User not found" });
				return;
			}

			const changes: Record<string, string> = {};

			if (req.body.name) {
				const exists = await req.db.user.findUnique({
					where: { name: req.body.name },
				});
				if (exists) {
					res.status(400);
					res.send({ error: "User with that username already exists" });
					return;
				}
				changes.name = req.body.name;
			}

			if (req.body.password) {
				changes.password = await bcrypt.hash(req.body.password, 12);
			}

			if (req.body.permissions) {
				if (!manageUsers) {
					res.code(403).send({ error: "Forbidden" });
					return;
				}
				if (req.body.permissions.some((e) => !permissions.includes(e))) {
					res.code(400).send({ error: "Invalid permissions" });
					return;
				}
				changes.permissions = req.body.permissions.join(" ");
			}

			const updatedUser = await req.db.user.update({
				where: { id: user.id },
				data: changes,
			});

			res.send({ name: updatedUser.name, id: user.id });
		},
	},
};
