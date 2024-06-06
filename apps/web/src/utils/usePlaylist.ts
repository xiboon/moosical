import type { Playlist } from "@moosical/types";
import useSWR from "swr";

export function usePlaylist(id: number | string) {
	const { data, error, isLoading } = useSWR(`/playlists/${id}`, { revalidateIfStale: false });

	return {
		playlist: data as Playlist,
		isLoading,
		isError: error,
	};
}
