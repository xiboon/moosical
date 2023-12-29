export const routes = {
    get: {
        handler: async (req, res) => {
            const dbSong = await req.db.song.findUnique({
                where: { id: parseInt(req.params.id) },
            });
            if (!dbSong)
                return res.code(404).send({ error: "Song not found" });
            const artist = await req.db.artist.findUnique({
                where: { id: dbSong.artistId },
            });
            const lyrics = await req.lyricsProvider.findLyrics(artist.name, dbSong.title);
            res.code(200).send(lyrics);
        },
    },
};
