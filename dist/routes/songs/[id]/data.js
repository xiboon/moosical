import { spawn } from "child_process";
import { createReadStream, existsSync } from "fs";
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
            const filename = process.env.SAVE_TRANSCODED
                ? join(req.musicPath, `${song.id}.transcoded.${formatExtension}`)
                : `/tmp/${song.id}.${formatExtension}`;
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
            if (exists && process.env.SAVE_TRANSCODED) {
                const file = format === "flac" && song.filename.endsWith(".flac")
                    ? await readFile(song.filename)
                    : await readFile(filename);
                console.log(file, song.filename);
                console.log("that's!");
                res.type(format === "opus" ? "audio/ogg" : "audio/flac");
                return res.send(file);
            }
            const argumentList = ["-y", "-i", song.filename, "-c:a", "libopus"];
            if (format === "opus")
                argumentList.push("-b:a", "160k");
            argumentList.push(filename);
            const stream = spawn("/usr/bin/ffmpeg", argumentList);
            stream.stdout.on("data", (data) => {
                console.log(data.toString());
            });
            const promise = new Promise((resolve) => {
                stream.stdout.on("end", async () => {
                    console.log("deez");
                    resolve(await readFile(filename));
                });
            });
            res.type(format === "opus" ? "audio/ogg" : "audio/flac");
            res.send(await promise);
        },
    },
};
