import { Album } from "./Album";
import { Song } from "./Song";

export interface Artist {
	id: number;
	name: string;
	albums?: Album[];
	songs?: Song[];
}
