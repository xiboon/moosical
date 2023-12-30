import prism from "prism-media";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
export const routes = {
    get: {
        handler: async (req, res) => {
            const format = req.query.format || "flac";
            const ignore = req.query.ignore || true;
            const song = await req.db.song.findUnique({
                where: { id: parseInt(req.params.id) },
            });
            if (!song)
                return res.code(404).send({ error: "Song not found" });
            const formatExtension = format === "opus" ? "ogg" : "flac";
            const filename = join(req.musicPath, `${req.params.id}.transcoded.${formatExtension}`);
            if (!ignore) {
                await req.db.song.update({
                    where: {
                        id: song.id,
                    },
                    data: { listens: { increment: 1 } },
                });
            }
            if (format === "flac" && song.filename.endsWith(".flac")) {
                const stream = createReadStream(song.filename);
                res.type("audio/flac");
                return res.send(stream);
            }
            const exists = existsSync(filename);
            if (exists) {
                const file = format === "flac" && song.filename.endsWith(".flac")
                    ? await readFile(song.filename)
                    : await readFile(filename);
                console.log(file, filename);
                console.log("that's!");
                res.type(format === "opus" ? "audio/ogg" : "audio/flac");
                return res.send(file);
            }
            const argumentList = format === "opus"
                ? ["-c:a", "libopus", "-f", "ogg", "-b:a", "160k"]
                : ["-c:a", "flac", "-f", "flac"];
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
