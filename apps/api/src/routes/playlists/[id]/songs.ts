import type { FastifyReply, FastifyRequest } from "fastify";
// TODO: remove pagination actually cause it doesn't really matter? 

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string };
				Querystring: {
					before: string;
					after: string;
				};
			}>,
			res: FastifyReply,
		) => {

			const id = Number.parseInt(req.params.id);
			const playlist = await req.db.playlist.findUnique({
				where: { id },
				select: {
					public: true,
					userId: true,
					id: true,
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
			if (req.query.before && Number.isNaN(Number.parseInt(req.query.before))) {
				return res.code(400).send({ error: "Invalid querystring" });
			}

			if (req.query.after && Number.isNaN(Number.parseInt(req.query.after))) {
				return res.code(400).send({ error: "Invalid querystring" });
			}

			const songIds = await req.db.playlistPosition.findMany({
				where: {
					playlistId: playlist.id,
				},
				orderBy: { position: "asc" },
				take: req.query.before ? Number.parseInt(req.query.before) : undefined,
				skip: req.query.after ? Number.parseInt(req.query.after) : undefined
			});
			const songIdsMap = songIds.reduce((acc, e) => {
				acc[e.songId] = e;
				return acc;
			}, {
			});


			const songs = (await req.transformers.transformSongs(await req.db.song.findMany({
				where: { id: { in: songIds.map((e) => e.songId) } },
			}))).map(e => ({ ...e, position: songIdsMap[e.id].position, timeAdded: songIdsMap[e.id].dateAdded }));

			res.send(songs);
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
