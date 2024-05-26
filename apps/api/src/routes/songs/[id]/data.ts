import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { join } from "node:path";
import send from "@fastify/send";
import type { FastifyReply, FastifyRequest } from "fastify";
import prism from "prism-media";
import { env } from "../../../util/env.js";
// import Ffmpeg from "fluent-ffmpeg";
// import { Writable } from "stream";
export const routes = {
	get: {
		handler: async (
			req: FastifyRequest<{
				Params: { id: string };
				Querystring: {
					format?: "opus" | "flac" | "original";
					quality: "64" | "96" | "128" | "160" | "320";
				};
			}>,
			res: FastifyReply,
		) => {
			try {
				// const stream = new Writable();
				const format = req.query.format || "original";
				req.query.quality ??= "160";
				if (!["64", "96", "128", "160", "320"].includes(req.query.quality))
					return res.code(400).send({ error: "Invalid quality" });

				const song = await req.db.song.findUnique({
					where: { id: Number.parseInt(req.params.id) },
				});

				if (!song) return res.code(404).send({ error: "Song not found" });
				const formatExtension = format === "opus" ? "ogg" : "flac";
				const transcoding = !song.filename.endsWith(formatExtension);
				const filename = transcoding
					? join(
							env.MUSIC_PATH,
							`${req.params.id}.transcoded${req.query.quality}.${formatExtension}`,
						)
					: song.filename;
				// console.log(req.query, format, transcoding);
				// console.log(filename, existsSync(filename));
				if (transcoding && !existsSync(filename)) {
					const argumentList =
						format === "opus"
							? [
									"-c:a",
									"libopus",
									"-f",
									"ogg",
									"-b:a",
									`${req.query.quality}k`,
								]
							: ["-c:a", "flac", "-f", "flac"];
					const ffmpeg = new prism.FFmpeg({ args: argumentList });

					const stream = createReadStream(song.filename).pipe(ffmpeg);
					const writeStream = env.SAVE_TRANSCODED
						? createWriteStream(filename)
						: null;
					if (writeStream) stream.pipe(writeStream);
					await new Promise<string>((resolve) => {
						const chunks: Buffer[] = [];
						stream.on("data", (chunk) => chunks.push(chunk));
						stream.on("end", () => resolve(filename));
					});
				}

				return send(req.raw, filename);
			} catch (e) {
				console.error(e);
				return res.code(500).send({ error: "Internal server error" });
			}
		},
	},
};
