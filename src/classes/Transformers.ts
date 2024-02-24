import { Album, Artist, Playlist, PrismaClient, Song } from "@prisma/client";

export class Transformers {
	constructor(private db: PrismaClient) {}
	async transformSong(song: Song, includeAlbum = true) {
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
		const album = includeAlbum
			? await this.db.album.findUnique({
					where: { id: song.albumId },
			  })
			: null;

		return {
			id: song.id,
			title: song.title,
			artist,
			featuredArtists,
			album: album ? await this.transformAlbum(album, false) : null,
			duration: song.duration,
		};
	}
	async transformAlbum(album: Album, includeSongs = true) {
		const artist = await this.db.artist.findUnique({
			where: { id: album.artistId },
		});
		const songs = includeSongs
			? await Promise.all(
					(
						await this.db.song.findMany({
							where: { albumId: album.id },
						})
					).map((e) => this.transformSong(e, false)),
			  )
			: [];
		return {
			id: album.id,
			title: album.title,
			artist: await this.transformArtist(artist, false, false),
			songs,
		};
	}
	async transformArtist(
		artist: Artist,
		includeAlbums = true,
		includeSongs = true,
	) {
		const albums = includeAlbums
			? await Promise.all(
					(
						await this.db.album.findMany({
							where: { artistId: artist.id },
						})
					).map((e) => this.transformAlbum(e)),
			  )
			: [];
		const songs = includeSongs
			? await Promise.all(
					(
						await this.db.song.findMany({
							where: { artistId: artist.id },
						})
					).map((e) => this.transformSong(e)),
			  )
			: [];
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
			songs = await Promise.all(
				(
					await this.db.song.findMany({
						where: {
							id: { in: playlist.songIds.split(" ").map((e) => parseInt(e)) },
						},
					})
				).map((e) => this.transformSong(e)),
			);
		}
		const author = await this.db.user.findUnique({
			where: { id: playlist.userId },
		});
		return {
			id: playlist.id,
			name: playlist.title,
			description: playlist.description,
			author: { name: author.name, id: author.id },
			songs,
		};
	}
}
