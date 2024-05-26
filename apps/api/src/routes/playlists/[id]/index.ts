import type { FastifyReply, FastifyRequest } from "fastify";
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const id = Number.parseInt(req.params.id);
			const playlist = await req.db.playlist.findUnique({ where: { id } });
			if (!playlist) {
				res.code(404).send({ error: "Playlist not found" });
				return;
			}
			if (!playlist.public && playlist.userId !== req.userId) {
				res.code(403).send({ error: "Forbidden" });
				return;
			}
			res.send(await req.transformers.transformPlaylist(playlist, false));
		},
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
