import type { Album } from "./Album";
import type { Song } from "./Song";

export interface Artist {
	id: number;
	name: string;
	albums?: Album[];
	songs?: Song[];
}
