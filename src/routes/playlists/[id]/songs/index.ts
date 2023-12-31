import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	put: {
		handler: async (
			req: FastifyRequest<{
				Body: { songIds: number[] };
				Params: { id: string };
			}>,
			res: FastifyReply,
		) => {
			const id = parseInt(req.params.id);
			if (!id || Number.isNaN(id)) {
				res.code(400).send({ error: "Invalid id" });
				return;
			}
			if (req.body.songIds?.length === 0 || !req.body.songIds)
				return res.code(400).send({ error: "Invalid songIds" });
			const songIds = req.body.songIds?.join(" ");
			if (!songIds) {
				res.code(400).send({ error: "Invalid songIds" });
				return;
			}
			const playlist = await req.db.playlist.findUnique({
				where: { id: parseInt(req.params.id) },
			});
			if (!playlist) {
				res.code(404).send({ error: "Playlist not found" });
				return;
			}
			const songs = await req.db.song.findMany({
				where: {
					id: {
						in: req.body.songIds,
					},
				},
			});
			if (songs.length !== req.body.songIds.length) {
				res.code(400).send({ error: "Invalid songIds" });
				return;
			}
			const updatedPlaylist = await req.db.playlist.update({
				where: { id },
				data: {
					songIds: playlist.songIds.split(" ").concat(songIds).join(" "),
				},
			});
			res.send(await req.transformers.transformPlaylist(updatedPlaylist, true));
		},
	},
	delete: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string };
				Body: { songIds: number[] };
			}>,
			res,
		) => {
			const id = parseInt(req.params.id);
			if (!id || Number.isNaN(id)) {
				res.code(400).send({ error: "Invalid id" });
				return;
			}
			const playlist = await req.db.playlist.findUnique({
				where: { id: parseInt(req.params.id) },
			});
			if (!playlist) {
				res.code(404).send({ error: "Playlist not found" });
				return;
			}
			await req.db.playlist.update({
				where: { id },
				data: {
					songIds: playlist.songIds
						.split(" ")
						.filter((e) => !req.body.songIds.includes(parseInt(e)))
						.join(" "),
				},
			});
			res.send({ success: true });
		},
	},
};
