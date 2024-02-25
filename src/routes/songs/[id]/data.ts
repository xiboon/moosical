import prism from "prism-media";
import { FastifyRequest, FastifyReply } from "fastify";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import mime from "mime";
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
					ignore?: boolean;
				};
			}>,
			res: FastifyReply,
		) => {
			// const stream = new Writable();
			const format = req.query.format || "original";
			const ignore = req.query.ignore || true;
			req.query.quality ??= "160";
			if (!["64", "96", "128", "160", "320"].includes(req.query.quality))
				return res.code(400).send({ error: "Invalid quality" });

			const song = await req.db.song.findUnique({
				where: { id: parseInt(req.params.id) },
			});

			if (!song) return res.code(404).send({ error: "Song not found" });

			const formatExtension = format === "opus" ? "ogg" : "flac";
			const filename = join(
				env.MUSIC_PATH,
				`${req.params.id}.transcoded${req.query.quality}.${formatExtension}`,
			);
			if (!ignore) {
				await req.db.song.update({
					where: {
						id: song.id,
					},
					data: { listens: { increment: 1 } },
				});
			}
			if (
				(format === "flac" && song.filename.endsWith(".flac")) ||
				format === "original"
			) {
				const stream = await readFile(song.filename);
				res.type(mime.getType(song.filename) || "audio/flac");
				return res.send(stream);
			}
			const exists = existsSync(filename);

			if (exists) {
				const file =
					format === "flac" && song.filename.endsWith(".flac")
						? await readFile(song.filename)
						: await readFile(filename);
				console.log(file, filename);
				console.log("that's!");
				res.type(format === "opus" ? "audio/ogg" : "audio/flac");
				return res.send(file);
			}

			const argumentList =
				format === "opus"
					? ["-c:a", "libopus", "-f", "ogg", "-b:a", `${req.query.quality}k`]
					: ["-c:a", "flac", "-f", "flac"];
			console.log(argumentList);
			const writeStream = process.env.SAVE_TRANSCODED
				? createWriteStream(filename)
				: null;
			const ffmpeg = new prism.FFmpeg({ args: argumentList });

			res.type(format === "opus" ? "audio/ogg" : "audio/flac");

			const stream = createReadStream(song.filename).pipe(ffmpeg);

			stream.on("data", (chunk) => {
				writeStream?.write(chunk);
			});
			stream.on("end", () => {
				writeStream?.end();
			});

			await res.send(stream);
		},
	},
};
