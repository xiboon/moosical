import { Album } from "./Album";
import { Artist } from "./Artist";

export interface Song {
	id: number;
	title: string;
	artist: Artist;
	featuredArtists: string[];
	album?: Album;
	duration: number;
	format: string;
}
