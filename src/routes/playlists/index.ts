import { FastifyRequest, FastifyReply } from "fastify";

export const routes = {
	get: {
		handler: async (req, res: FastifyReply) => {
			const allPlaylists = await req.db.playlist.findMany();
			allPlaylists.map((e) => {
				return req.transformers.transformPlaylist(e, false);
			});
			res.send(await Promise.all(allPlaylists));
		},
	},
	post: {
		handler: async (
			req: FastifyRequest<{ Body: { name: string; description: string } }>,
			res,
		) => {
			const { name, description } = req.body;
			const playlist = await req.db.playlist.create({
				data: {
					title: name,
					description,
					songIds: "",
				},
			});
			res.send(await req.transformers.transformPlaylist(playlist, true));
		},
	},
};
