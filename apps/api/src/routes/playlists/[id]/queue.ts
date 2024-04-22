import type { FastifyReply, FastifyRequest } from "fastify";

export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string };
				Querystring: {
					shuffle: string;
					sort:
						| "artistName"
						| "title"
						| "albumTitle"
						| "timeAdded"
						| "duration";
					sortDirection: "asc" | "desc";
					startFrom: string;
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

			const songPositions = await req.db.playlistPosition.findMany({
				where: { playlistId: id },
				select: { songId: true },
				orderBy: sort === "timeAdded" ? { position: "asc" } : undefined,
			});

			let songIds = songPositions.map((e) => e.songId);

			if (req.query.shuffle === "true")
				songIds = songIds.sort(() => Math.random() - 0.5);
			if (sort === "timeAdded" || req.query.shuffle === "true")
				return res.send(songIds);

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

			const songs = (
				await req.db.song.findMany({
					where: {
						id: {
							in: songIds,
						},
					},
					orderBy,
				})
			).map((e) => e.id);
			return res.send(
				req.query.startFrom
					? songs.slice(songs.indexOf(Number.parseInt(req.query.startFrom)))
					: songs,
			);
		},
	},
};
