import { Artist } from "./Artist";
import { Song } from "./Song";
export interface Album {
	id: number;
	title: string;
	artist: Artist;
	songs?: Song[];
}
