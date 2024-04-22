import useSWR from "swr";
import type { User } from "../types/User";

export function useUser(id: number | "me") {
	const { data, error, isLoading } = useSWR(`/users/${id}`);

	return {
		user: data as User,
		isLoading,
		isError: error,
	};
}
