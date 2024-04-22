import useSWR from "swr";
import type { Song } from "../types/Song";

export function useSong(id: number) {
	const { data, error, isLoading } = useSWR(`/songs/${id}`);

	return {
		song: data as Song,
		isLoading,
		isError: error,
	};
}
