import { distance } from "fastest-levenshtein";
export const routes = {
    get: {
        handler: async (req, res) => {
            const limit = parseInt(req.query.limit) || 25;
            if (Number.isNaN(limit)) {
                res.code(400).send({ error: "Limit must be a number" });
                return;
            }
            const allAlbums = await req.db.album.findMany();
            const distanceArray = allAlbums.map(async (album) => {
                const artist = await req.db.artist.findUnique({
                    where: { id: album.artistId },
                });
                let distanceNum = distance(req.query.search, album.title) / album.title.length;
                if (artist.name.toLowerCase().startsWith(req.query.search.toLowerCase()))
                    distanceNum = distanceNum / 2;
                return {
                    distance: distanceNum,
                    album,
                };
            });
            const sortedAlbums = (await Promise.all(distanceArray)).sort((a, b) => a.distance - b.distance);
            const albums = await Promise.all(sortedAlbums
                .slice(0, limit)
                .map((e) => req.transformers.transformAlbum(e.album)));
            res.code(200).send(albums);
        },
    },
};
