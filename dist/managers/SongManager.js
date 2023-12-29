export class SongManager {
    constructor(db) {
        this.db = db;
    }
    async addArtist(name, cover) {
        const artist = await this.db.artist.findMany({
            where: { name },
        });
        if (artist.length > 0) {
            return artist[0].id;
        }
        const data = await this.db.artist.create({
            data: { name },
        });
        return data.id;
    }
    async addAlbum(name, releaseDate, artistId, mbid) {
        const album = await this.db.album.findFirst({
            where: { title: name },
        });
        if (album)
            return album.id;
        const data = await this.db.album.create({
            data: {
                title: name,
                release: new Date(releaseDate),
                artistId,
                mbid,
            },
        });
        return data.id;
    }
    async addSong(data) {
        const { title, albumId, artistId, duration, featuredArtistsIds, filename, coverArtFormat, } = data;
        const { id } = await this.db.song.create({
            data: {
                title: title,
                album: { connect: { id: albumId } },
                artist: { connect: { id: artistId } },
                duration,
                featuredArtistsIds,
                filename,
                coverArtFormat,
            },
        });
        return id;
    }
    async addSongToDB(song) {
        if (song === undefined)
            return;
        const artist = await this.addArtist(song.artist);
        const featuredArtists = await Promise.all(song.featuredArtists.map(async (e) => {
            return (await this.addArtist(e)).toString();
        }));
        const albumId = await this.addAlbum(song.album.title, song.album["first-release-date"], artist, song.album.id);
        return this.addSong({
            title: song.title,
            albumId: albumId,
            artistId: artist,
            duration: song.duration,
            filename: song.filename,
            featuredArtistsIds: featuredArtists.join(" "),
            coverArtFormat: song.coverArtFormat,
        });
    }
}
