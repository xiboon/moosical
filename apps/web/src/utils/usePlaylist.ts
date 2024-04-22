import useSWR from "swr";
import type { Playlist } from "../types/Playlist";

export function usePlaylist(id: number) {
	const { data, error, isLoading } = useSWR(`/playlists/${id}`);

	return {
		playlist: data as Playlist,
		isLoading,
		isError: error,
	};
}