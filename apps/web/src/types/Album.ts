import type { Artist } from "./Artist";
import type { Song } from "./Song";
export interface Album {
	id: number;
	title: string;
	artist: Artist;
	songs?: Song[];
}
