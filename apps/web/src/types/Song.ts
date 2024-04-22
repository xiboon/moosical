import type { Album } from "./Album";
import type { Artist } from "./Artist";

export interface Song {
	id: number;
	title: string;
	artist: Artist;
	featuredArtists: string[];
	album?: Album;
	duration: number;
	format: string;
}
