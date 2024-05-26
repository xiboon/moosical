import type { Playlist } from "@moosical/types";
import useSWR from "swr";

export function usePlaylist(id: number) {
	const { data, error, isLoading } = useSWR(`/playlists/${id}`);

	return {
		playlist: data as Playlist,
		isLoading,
		isError: error,
	};
}
