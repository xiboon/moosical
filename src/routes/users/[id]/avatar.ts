import { FastifyRequest, FastifyReply } from "fastify";
import { readFile, writeFile } from "fs/promises";
import crypto from "crypto";
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
				if (!authorUser?.permissions.split(" ").includes("MANAGE_USERS")) {
					res.code(403).send({ error: "Forbidden" });
					return;
				}
			}

			const user = await req.db.user.findUnique({
				where: { id: parseInt(req.params.id) },
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
				`${req.imagePath}/user_${hash}.${image.mimetype.split("image/")[1]}`,
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
				where: { id: parseInt(req.params.id) },
			});
			if (!user) return res.code(404).send({ error: "User not found" });
			const hash = crypto.createHash("sha1").update(user.name).digest("hex");
			const file = await readFile(
				`${req.imagePath}/user_${hash}.${user.avatarExtension}`,
			);
			res.type(`image/${user.avatarExtension}`);
			res.send(file);
		},
	},
};
