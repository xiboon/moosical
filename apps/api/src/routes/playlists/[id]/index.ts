import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from 'zod';
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string },
				Querystring: {
					includeSongs: string;
					songsBefore: string;
				}
			}>,
			res: FastifyReply,
		) => {
			const id = Number.parseInt(req.params.id);
			const playlist = await req.db.playlist.findUnique({ where: { id } });
			if (!playlist) {
				res.code(404).send({ error: "Playlist not found" });
				return;
			}
			if (req.query.songsBefore && Number.isNaN(Number.parseInt(req.query.songsBefore))) {
				return res.code(403).send({ error: "Forbidden" });
			}
			if (!playlist.public && playlist.userId !== req.userId) {
				res.code(403).send({ error: "Forbidden" });
				return;
			}
			res.send(await req.transformers.transformPlaylist(playlist, req.query.includeSongs !== "false", 0, Number.parseInt(req.query.songsBefore)));
		},
	},
	patch: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string }, Body: { name: string; description: string; public: boolean; } }>,
			res: FastifyReply
		) => {
			const playlistSchema = z.object({
				name: z.string().max(100, 'Name can not be over 100 characters long.').optional(),
				description: z.string().max(300, 'Description can not be over 300 characters long.').optional(),
				public: z.boolean().optional()
			})
			const { name, description, public: publicPlaylist } = playlistSchema.parse(req.body);
			const id = Number.parseInt(req.params.id);
			if (!id || Number.isNaN(id)) {
				res.code(400).send({ error: "Invalid id" });
				return;
			}
			await req.db.playlist.update({
				where: { id },
				data: { title: name, description, public: publicPlaylist }
			})
		}

	},
	delete: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const id = Number.parseInt(req.params.id);
			if (!id || Number.isNaN(id)) {
				res.code(400).send({ error: "Invalid id" });
				return;
			}
			const playlist = await req.db.playlist.findUnique({ where: { id } });
			if (!playlist) {
				res.code(404).send({ error: "Playlist not found" });
				return;
			}
			await req.db.playlistPosition.deleteMany({ where: { playlistId: id } });
			await req.db.playlist.delete({ where: { id } });
			res.send({ success: true });
		},
	},
};
