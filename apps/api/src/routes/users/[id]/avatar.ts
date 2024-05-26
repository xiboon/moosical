import crypto from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import type { FastifyReply, FastifyRequest } from "fastify";
import mime from "mime";
import { env } from "../../../util/env.js";
export const routes = {
	post: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			if (req.params.id === "me" && !req.userId) {
				res.code(401).send({ error: "Unauthorized" });
				return;
			}
			const authorUser = await req.db.user.findUnique({
				where: { id: req.userId },
			});
			if (req.params.id !== "me") {
				if (!authorUser?.permissions.includes("MANAGE_USERS")) {
					res.code(403).send({ error: "Forbidden" });
					return;
				}
			}

			const user = await req.db.user.findUnique({
				where: { id: Number.parseInt(req.params.id) },
			});
			if (!user) return res.code(404).send({ error: "User not found" });
			const image = await req.file();
			if (image?.type !== "file")
				return res.code(400).send({ error: "No file provided" });
			if (
				!image.mimetype.startsWith("image/") ||
				image.mimetype === "image/svg+xml"
			)
				return res.code(400).send({ error: "Invalid file" });
			const hash = crypto.createHash("sha1").update(user.name).digest("hex");
			await writeFile(
				`${env.IMAGE_PATH}/user_${hash}.${image.mimetype.split("image/")[1]}`,
				await image.toBuffer(),
			);
			await req.db.user.update({
				where: { id: user.id },
				data: { avatarExtension: image.mimetype.split("image/")[1] },
			});
			res.code(204).send();
		},
	},
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const user = await req.db.user.findUnique({
				where: { id: Number.parseInt(req.params.id) },
			});
			if (!user) return res.code(404).send({ error: "User not found" });
			let file: Buffer;
			try {
				const hash = crypto.createHash("sha1").update(user.name).digest("hex");
				file = await readFile(
					`${env.IMAGE_PATH}/user_${hash}.${user.avatarExtension}`,
				);
			} catch (e) {
				return res.code(404).send({ error: "File not found" });
			}
			const mimetype = mime.getType(user.avatarExtension);
			res.type(mimetype);
			res.send(file);
		},
	},
};
