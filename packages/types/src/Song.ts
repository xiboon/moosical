import type { Album } from "./Album";
import type { Artist } from "./Artist";

export interface Song {
	id: number;
	title: string;
	artist: Artist;
	featuredArtists: Artist[];
	album?: Album;
	duration: number;
	format: string;
}
export interface PlaylistSong extends Song {
	timeAdded: string;

}
