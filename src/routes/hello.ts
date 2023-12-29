import { Route } from "fastify-file-routes";

export const routes: Route = {
	get: { handler: (req, res) => res.send("Hello, world!") },
};
