export class Transformers {
    constructor(db) {
        this.db = db;
    }
    async transformSong(song) {
        const artist = await this.db.artist.findUnique({
            where: { id: song.artistId },
        });
        const artistIds = song.featuredArtistsIds
            .split(" ")
            .map((e) => parseInt(e));
        const featuredArtists = Number.isNaN(artistIds[0])
            ? []
            : await this.db.artist.findMany({
                where: {
                    id: {
                        in: song.featuredArtistsIds.split(" ").map((e) => parseInt(e)),
                    },
                },
            });
        const album = await this.db.album.findUnique({
            where: { id: song.albumId },
        });
        return {
            id: song.id,
            title: song.title,
            artist,
            featuredArtists,
            album,
            duration: song.duration,
            format: song.coverArtFormat,
        };
    }
    async transformAlbum(album) {
        const artist = await this.db.artist.findUnique({
            where: { id: album.artistId },
        });
        const songs = await Promise.all((await this.db.song.findMany({
            where: { albumId: album.id },
        })).map((e) => this.transformSong(e)));
        return {
            id: album.id,
            title: album.title,
            artist,
            songs,
            mbid: album.mbid,
            releaseDate: album.release.toUTCString(),
        };
    }
    async transformArtist(artist) {
        const albums = await Promise.all((await this.db.album.findMany({
            where: { artistId: artist.id },
        })).map((e) => this.transformAlbum(e)));
        const songs = await Promise.all((await this.db.song.findMany({
            where: { artistId: artist.id },
        })).map((e) => this.transformSong(e)));
        return {
            id: artist.id,
            name: artist.name,
            albums,
            songs,
        };
    }
    async transformPlaylist(playlist, includeSongs = true) {
        let songs = [];
        if (includeSongs) {
            songs = (await this.db.song.findMany({
                where: {
                    id: { in: playlist.songIds.split(" ").map((e) => parseInt(e)) },
                },
            })).map((e) => ({
                name: e.title,
                artist: e.artistId,
                album: e.albumId,
            }));
        }
        return {
            id: playlist.id,
            name: playlist.title,
            description: playlist.description,
            songs,
        };
    }
}
