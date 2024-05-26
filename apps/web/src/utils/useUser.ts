import type { User } from "@moosical/types";
import useSWR from "swr";

export function useUser(id: number | "me") {
	const { data, error, isLoading } = useSWR(`/users/${id}`);

	return {
		user: data as User,
		isLoading,
		isError: error,
	};
}
