import { Album, Artist, Playlist, PrismaClient, Song } from "@prisma/client";

export class Transformers {
	constructor(private db: PrismaClient) {}
	async transformSong(song: Song) {
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
	async transformAlbum(album: Album) {
		const artist = await this.db.artist.findUnique({
			where: { id: album.artistId },
		});
		const songs = await Promise.all(
			(
				await this.db.song.findMany({
					where: { albumId: album.id },
				})
			).map((e) => this.transformSong(e)),
		);
		return {
			id: album.id,
			title: album.title,
			artist,
			songs,
		};
	}
	async transformArtist(artist: Artist) {
		const albums = await Promise.all(
			(
				await this.db.album.findMany({
					where: { artistId: artist.id },
				})
			).map((e) => this.transformAlbum(e)),
		);
		const songs = await Promise.all(
			(
				await this.db.song.findMany({
					where: { artistId: artist.id },
				})
			).map((e) => this.transformSong(e)),
		);
		return {
			id: artist.id,
			name: artist.name,
			albums,
			songs,
		};
	}
	async transformPlaylist(playlist: Playlist, includeSongs = true) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let songs: Record<string, any>[] = [];
		if (includeSongs) {
			songs = (
				await this.db.song.findMany({
					where: {
						id: { in: playlist.songIds.split(" ").map((e) => parseInt(e)) },
					},
				})
			).map((e) => ({
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
