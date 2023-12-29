import { distance } from "fastest-levenshtein";
export const routes = {
    get: {
        handler: async (req, res) => {
            const search = req.query.search;
            const limit = req.query.limit || 50;
            if (search.length > 100) {
                res.code(400).send({ error: "Search string too long" });
                return;
            }
            if (limit > 100) {
                res.code(400).send({ error: "Limit too high" });
                return;
            }
            const allSongs = await req.db.song.findMany();
            const songByListens = allSongs.sort((a, b) => b.listens - a.listens);
            const songTitles = (await Promise.all(allSongs.map(async (song, i) => {
                const artist = await req.db.artist.findUnique({
                    where: { id: song.artistId },
                });
                let distanceNum = 0;
                if (!song.title.toLowerCase().startsWith(search.toLowerCase()))
                    distanceNum = distance(search, song.title) / song.title.length;
                distanceNum = distanceNum / (songByListens.indexOf(song) + 1);
                if (artist.name.toLowerCase().startsWith(search.toLowerCase()))
                    distanceNum = distanceNum / 2;
                return {
                    distance: distanceNum,
                    title: song.title,
                    index: i,
                };
            }))).sort((a, b) => a.distance - b.distance);
            const songs = await Promise.all(songTitles
                .slice(0, limit)
                .map((e) => req.transformers.transformSong(allSongs[e.index])));
            res.code(200).send(songs);
        },
    },
};
