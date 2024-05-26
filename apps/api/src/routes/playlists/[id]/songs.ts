import type { FastifyReply, FastifyRequest } from "fastify";
// TODO: remove pagination actually cause it doesn't really matter? 

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string };
			}>,
			res: FastifyReply,
		) => {

			const id = Number.parseInt(req.params.id);
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

			const songs = await req.db.playlistPosition.findMany({
				where: { playlistId: id },
				select: { songId: true, position: true, dateAdded: true },
			});

			const songIds = songs
				.sort((a, b) => a.position - b.position)

			// TODO: optimize this to not be O(n^2)
			const songsData = await req.db.song.findMany({
				where: {
					id: {
						in: songIds.map((e) => e.songId),
					},
				},
			});
			res.send(
				(await Promise.all(
					songsData.map((e) => req.transformers.transformSong(e, false)),
				)).map(e => ({ ...e, position: songs.find(s => s.songId === e.id)?.position, timeAdded: songs.find(s => s.songId === e.id) })),
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
			const id = Number.parseInt(req.params.id);
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
				where: { id: Number.parseInt(req.params.id) },
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
			const lastPosition = await req.db.playlistPosition.findFirst({
				where: { playlistId: id },
				orderBy: { position: "desc" },
			});
			await req.db.playlistPosition.createMany({
				data: req.body.songIds.map((songId, index) => ({
					playlistId: id,
					songId,
					position: index + (lastPosition.position || 1),
				}))
			});

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
			const id = Number.parseInt(req.params.id);
			if (!id || Number.isNaN(id)) {
				res.code(400).send({ error: "Invalid id" });
				return;
			}
			const playlist = await req.db.playlist.findUnique({
				where: { id: Number.parseInt(req.params.id) },
			});
			if (!playlist) {
				res.code(404).send({ error: "Playlist not found" });
				return;
			}
			if (!playlist.public && playlist.userId !== req.userId) {
				res.code(403).send({ error: "Forbidden" });
				return;
			}
			await req.db.playlistPosition.deleteMany({
				where: {
					playlistId: id,
					songId: {
						in: req.body.songIds,
					},
				},
			});
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
