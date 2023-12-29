export const routes = {
    get: {
        handler: async (req, res) => {
            const song = await req.db.song.findUnique({
                where: { id: parseInt(req.params.id) },
            });
            if (!song)
                return res.code(404).send({ error: "Song not found" });
            res.code(200).send(await req.transformers.transformSong(song));
        },
    },
};
