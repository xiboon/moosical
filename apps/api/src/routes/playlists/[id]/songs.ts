import type { FastifyReply, FastifyRequest } from "fastify";
// add other sorting - by artist, album, song name, time added
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string };

				Querystring: {
					limit: string;
					offset: string;
					sort:
						| "artistName"
						| "title"
						| "albumTitle"
						| "timeAdded"
						| "duration";
					sortDirection: "asc" | "desc";
				};
			}>,
			res: FastifyReply,
		) => {
			if (
				req.query.sort &&
				!["artistName", "title", "albumTitle", "timeAdded"].includes(
					req.query.sort,
				)
			) {
				res.code(400).send({ error: "Invalid sort type" });
			}
			const sort = req.query.sort || "timeAdded";
			const sortDirection = req.query.sortDirection || "asc";
			if (sortDirection !== "asc" && sortDirection !== "desc")
				return res.code(400).send({ error: "Invalid sort direction" });

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
				select: { songId: true, position: true },
				orderBy: sort === "timeAdded" ? { position: "asc" } : undefined,
			});

			const limit = Number.parseInt(req.query?.limit) || 50;
			if (limit > 100) {
				res.code(400).send({ error: "Limit too high" });
				return;
			}

			const offset = Number.parseInt(req.query.offset) || 0;
			const songIds = songs
				.sort((a, b) => a.position - b.position)
				.slice(offset, offset + limit);

			// biome-ignore lint:
			let orderBy: Record<string, any> = {
				[sort]: sortDirection,
			};
			if (sort === "albumTitle") {
				orderBy = {
					album: {
						title: sortDirection,
					},
				};
			}
			if (sort === "timeAdded") orderBy = undefined;

			const songsData = await req.db.song.findMany({
				where: {
					id: {
						in: songIds.map((e) => e.songId),
					},
				},
				orderBy,
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
