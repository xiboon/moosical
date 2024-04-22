import type { Playlist } from "./Playlist";

export interface User {
	id: string;
	name: string;
	playlists: Playlist[];
}
