import type { PlaylistSong } from "./Song";

export interface Playlist {
	id: string;
	title: string;
	description: string;
	author: { name: string; id: string };
	songs: PlaylistSong[];
}
