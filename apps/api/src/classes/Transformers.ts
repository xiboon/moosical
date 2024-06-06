import type { Album, Artist, Song } from "@moosical/types"
import type {
	Album as DBAlbum,
	Artist as DBArtist,
	Song as DBSong,
	Playlist,
	PrismaClient,
} from "@prisma/client";
export class Transformers {
	constructor(private db: PrismaClient) { }
	async transformSong(song: DBSong, includeAlbum = true): Promise<Song> {
		const artist = await this.db.artist.findUnique({
			where: { id: song.artistId },
		});
		const featuredArtists = Number.isNaN(song.featuredArtistsIds?.length)
			? []
			: await this.db.artist.findMany({
				where: {
					id: {
						in: song.featuredArtistsIds,
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
			positionOnAlbum: song.position
		};
	}


	async transformSongs(songs: DBSong[], includeAlbum = true): Promise<Song[]> {
		const allArtists = songs.reduce((acc, e) => {
			acc.add(e.artistId);
			e.featuredArtistsIds.forEach((id) => acc.add(id));
			return acc;
		}, new Set<number>());

		const allAlbums = songs.reduce((acc, e) => {
			acc.add(e.albumId);
			return acc;
		}, new Set<number>());

		const artists = (await this.db.artist.findMany({
			where: { id: { in: Array.from(allArtists) } },
			select: {
				id: true,
				name: true,
				cover: true,
				createdAt: true,
				updatedAt: true,
			}
		})).reduce((acc, e) => {
			acc[e.id] = e;
			return acc;
		}, {});

		const albums = (await this.db.album.findMany({
			where: { id: { in: Array.from(allAlbums) } },
		})).reduce((acc, e) => {
			acc[e.id] = e;
			return acc;
		}, {});

		return await Promise.all(
			songs.map(async (e) => {
				const artist = artists[e.artistId];
				const featuredArtists = e.featuredArtistsIds.map(e => artists[e]);
				const album = includeAlbum ? albums[e.albumId] : null;
				return {
					id: e.id,
					title: e.title,
					artist,
					featuredArtists,
					album: album ? await this.transformAlbum(album, false, artist) : null,
					duration: e.duration,
					positionOnAlbum: e.position
				};
			}),
		);
	}

	async transformAlbum(album: DBAlbum, includeSongs = true, albumArtist?: {
		id: number;
		name: string;
		cover: string;
		createdAt: Date;
		updatedAt: Date;
	}): Promise<Album> {
		const artist = albumArtist ?? await this.db.artist.findUnique({
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
		artist: DBArtist,
		includeAlbums = true,
		includeSongs = true,
	): Promise<Artist> {
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
	async transformPlaylist(playlist: Playlist, includeSongs = true, after?: number, before?: number) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let songs: Record<string, any>[] = [];
		if (includeSongs) {
			const songIds = await this.db.playlistPosition.findMany({
				where: {
					playlistId: playlist.id,
				},
				orderBy: { position: "asc" },
				take: before,
				skip: after
			});
			const songIdsMap = songIds.reduce((acc, e) => {
				acc[e.songId] = e;
				return acc;
			}, {
			});


			songs = (await this.transformSongs(await this.db.song.findMany({
				where: { id: { in: songIds.map((e) => e.songId) } },
			}))).map(e => ({ ...e, position: songIdsMap[e.id].position, timeAdded: songIdsMap[e.id].dateAdded }));
			// songs = await Promise.all(
			// (
			// await this.db.song.findMany({
			// where: { id: { in: songIds.map((e) => e.songId) } },
			// })
			// ).map(async (e) => ({ ...(await this.transformSong(e, true)), position: songIdsMap[e.id].position, timeAdded: songIdsMap[e.id].dateAdded })),
			// );
		}
		const author = await this.db.user.findUnique({
			where: { id: playlist.userId },
		});
		return {
			id: playlist.id,
			title: playlist.title,
			description: playlist.description,
			author: { name: author.name, id: author.id },
			songs,
		};
	}
}
