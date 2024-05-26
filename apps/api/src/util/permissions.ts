export const permissions = [
	"MANAGE_USERS" as const,
	"ADD_SONGS" as const,
	"DELETE_SONGS" as const,
	"MANAGE_PLAYLISTS" as const,
	"LYRICS" as const,
];
export type Permissions = typeof permissions;
