import type { FastifyReply, FastifyRequest } from "fastify";
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{ Params: { id: string } }>,
			res: FastifyReply,
		) => {
			const user = await req.db.user.findUnique({
				where: {
					id:
						req.params.id === "me"
							? req.userId
							: Number.parseInt(req.params.id),
				},
			});
			if (!user) {
				res.status(404);
				res.send({ error: "User not found" });
				return;
			}
			const playlists = await req.db.playlist.findMany({
				where: {
					userId: user.id,
				},
			});
			res.send({
				name: user.name,
				id: user.id,
				playlists: await Promise.all(
					playlists.map((e) => req.transformers.transformPlaylist(e, false)),
				),
			});
		},
	},
};
