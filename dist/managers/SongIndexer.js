import { glob } from "glob";
import { parseFile } from "music-metadata";
import crypto from "crypto";
import { appendFile } from "fs/promises";
export class SongIndexer {
    constructor(db, manager, songPaths, coverPath) {
        this.db = db;
        this.manager = manager;
        this.songPaths = songPaths;
        this.coverPath = coverPath;
        this.finishedAlbums = [];
    }
    async indexSongs() {
        console.log("Starting indexing");
        Promise.all(this.songPaths.map(async (path) => {
            const songs = await glob(`${path}/*`, { withFileTypes: true });
            const startingPromise = Promise.resolve(null);
            return songs.reduce((p, song) => {
                return p.then((e) => {
                    return this.parseSongFromPath(song);
                });
            }, startingPromise);
        })).then(() => {
            console.log("Done with indexing!");
        });
    }
    async parseSongFromPath(path) {
        const exists = await this.db.song.findMany({
            where: { filename: path.fullpath() },
        });
        if (exists.length !== 0) {
            return;
        }
        if (path.name.split(".").includes("transcoded"))
            return;
        const metadata = await parseFile(path.fullpath());
        if (metadata.common.picture) {
            const cover = metadata.common.picture[0];
            const hash = crypto
                .createHash("sha1")
                .update(metadata.common.artist + metadata.common.title)
                .digest("hex");
            const coverPath = `${this.coverPath}/${hash}.${cover.format.split("/")[1]}`;
            await appendFile(coverPath, cover.data);
        }
        return this.manager.addSongToDB({
            title: metadata.common.title,
            artist: metadata.common.artists[0],
            featuredArtists: metadata.common.artists.slice(1),
            album: metadata.common.album,
            duration: metadata.format.duration,
            filename: path.fullpath(),
            coverArtFormat: metadata.common.picture[0]?.format.split("/")[1],
        });
    }
}
