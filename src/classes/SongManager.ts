import { DiscogsClient } from "@lionralfs/discogs-client";
import { PrismaClient } from "@prisma/client";
export interface SongData {
	title: string;
	artist: string;
	featuredArtists: string[];
	album: string;
	duration: number;
	filename: string;
	coverArtFormat?: string;
}
export class SongManager {
	discogs = new DiscogsClient({
		auth: { userToken: process.env.DISCOGS_TOKEN },
	}).database();
	constructor(private db: PrismaClient) {}

	async addArtist(name: string, cover?: string): Promise<number> {
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

	async addAlbum(name: string, artistId: number): Promise<number> {
		const album = await this.db.album.findFirst({
			where: { title: name },
		});
		if (album) return album.id;

		const data = await this.db.album.create({
			data: {
				title: name,
				artistId: artistId,
			},
		});
		return data.id;
	}

	async addSong(data: {
		title: string;
		albumId: number;
		artistId: number;
		duration: number;
		featuredArtistsIds: number[];
		filename: string;
		artistName: string;
	}) {
		const {
			title,
			albumId,
			artistId,
			duration,
			featuredArtistsIds,
			filename,
			artistName,
		} = data;
		const { id } = await this.db.song.create({
			data: {
				title: title,
				album: { connect: { id: albumId } },
				artist: { connect: { id: artistId } },
				duration,
				artistName,
				featuredArtistsIds,
				filename,
			},
		});
		return id;
	}
	async addSongToDB(song: SongData) {
		if (song === undefined) return;

		const artist = await this.addArtist(song.artist);
		const featuredArtists = await Promise.all(
			song.featuredArtists.map(async (e) => {
				return await this.addArtist(e);
			}),
		);

		const albumId = await this.addAlbum(song.album, artist);

		return this.addSong({
			title: song.title,
			albumId: albumId,
			artistId: artist,
			duration: song.duration,
			filename: song.filename,
			featuredArtistsIds: featuredArtists,
			artistName: song.artist,
		});
	}
}
