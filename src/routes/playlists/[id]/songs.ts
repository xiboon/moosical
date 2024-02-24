import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string };
				Body: {
					limit: string;
					offset: string;
				};
			}>,
			res: FastifyReply,
		) => {
			const id = parseInt(req.params.id);
			const playlist = await req.db.playlist.findUnique({
				where: { id },
				select: {
					public: true,
					userId: true,
				},
			});

			if (!playlist) {
				res.code(404).send({ error: "Playlist not found" });
				return;
			}
			if (!playlist.public && playlist.userId !== req.userId) {
				res.code(403).send({ error: "Forbidden" });
				return;
			}
			const songs = playlist.songIds.split(" ").map(parseInt);
			const limit = parseInt(req.body.limit) || 50;
			if (limit > 100) {
				res.code(400).send({ error: "Limit too high" });
				return;
			}
			const offset = parseInt(req.body.offset) || 0;
			const songIds = songs.slice(offset, offset + limit);
			const songsData = await req.db.song.findMany({
				where: {
					id: {
						in: songIds,
					},
				},
			});
			res.send(
				await Promise.all(
					songsData.map((e) => req.transformers.transformSong(e, false)),
				),
			);
		},
	},
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
			if (!playlist.public && playlist.userId !== req.userId) {
				res.code(403).send({ error: "Forbidden" });
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
			if (!playlist.public && playlist.userId !== req.userId) {
				res.code(403).send({ error: "Forbidden" });
				return;
			}
			// await req.db.playlist.update({
			// 	where: { id },
			// 	data: {
			// 		songIds: playlist.songIds
			// 			.split(" ")
			// 			.filter((e) => !req.body.songIds.includes(parseInt(e)))
			// 			.join(" "),
			// 	},
			// });
			res.send({ success: true });
		},
	},
};
