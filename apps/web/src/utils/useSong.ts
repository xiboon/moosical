import type { Song } from "@moosical/types"
import useSWR from "swr";

export function useSong(id: number) {
	const { data, error, isLoading } = useSWR(`/songs/${id}`);

	return {
		song: data as Song,
		isLoading,
		isError: error,
	};
}
