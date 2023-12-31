import {
	FastifyInstance,
	FastifyPluginOptions,
	FastifyReply,
	FastifyRequest,
	HTTPMethods,
} from "fastify";
import { readdir } from "fs/promises";
import { join } from "path";
export type Route = "get" | "post" | "put" | "delete" | "patch";
export type Routes = Record<
	Route,
	{ handler: (req: FastifyRequest, res: FastifyReply) => void }
>;
export function plugin(
	instance: FastifyInstance,
	opts: FastifyPluginOptions,
	done,
) {
	loadRoutes(opts.path, instance).then(done);
}
export async function loadRoutes(
	path: string,
	instance: FastifyInstance,
	initialPath: string = path,
) {
	// console.log(initialPath);
	const files = await readdir(path, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory() || !file.name.endsWith(".js")) {
			await loadRoutes(join(path, file.name), instance, initialPath || path);
		} else {
			if (file.path.endsWith(".map")) continue;

			const route: { routes: Routes } = await import(
				`${file.path}/${file.name}`
			);

			let transformedPath = `${file.path}/${file.name}`
				.replaceAll(initialPath, "")
				.replaceAll(/\[(.*)\]/gm, ":$1")
				.replaceAll(".ts", "")
				.replaceAll(".js", "");

			if (transformedPath.endsWith("index"))
				transformedPath = transformedPath.slice(0, -5);

			Object.entries(route.routes).forEach(([method, { handler }]) => {
				instance.route({
					method: method.toUpperCase() as HTTPMethods,
					handler,
					url: transformedPath,
				});
			});
		}
	}
}
