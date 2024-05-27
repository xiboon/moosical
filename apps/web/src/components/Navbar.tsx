import type { Playlist } from "@moosical/types";
import { useState } from "react";
import { FaHome, FaStar } from "react-icons/fa";
import { FaGear, FaPlus, FaRegCircleUser } from "react-icons/fa6";
import { Link, Navigate, useLocation } from "react-router-dom";
import useSWR from "swr";
import Style from "../styles/Navbar.module.scss";
import { useUser } from "../utils/useUser";

export const Navbar: React.FC = () => {
	const location = useLocation();
	const [errorLoading, setErrorLoading] = useState(false);
	const {
		user,
		isError: userHasError,
		isLoading: userIsLoading,
	} = useUser("me");
	const { data: playlists, isLoading: playlistsLoading } =
		useSWR<Playlist[]>("/playlists");
	if (location.pathname === "/auth") return null;
	if (userIsLoading) return <div>Loading...</div>;
	if (userHasError) {
		return <Navigate to="/auth" />;
	}

	console.log(playlists);
	return (
		<div>
			<div className={Style.nav}>
				<div className={Style.user}>
					<div>
						{errorLoading ? (
							<FaRegCircleUser className={Style.avatar} />
						) : (
							<img
								src={`${import.meta.env.VITE_API_URL}/users/me/avatar`}
								alt="avatar"
								onError={() => setErrorLoading(true)}
								className={Style.avatar}
							/>
						)}
						<p>{user.name}</p>
					</div>
					<Link to="/settings" className={Style.settingsLink}>
						<FaGear />
					</Link>
				</div>
				<div className={Style.routes}>
					<Link to="/">
						<FaHome /> <p>Home</p>
					</Link>
					<Link to="/favorites">
						<FaStar /> <p>Favorites</p>
					</Link>
				</div>
				<div className={Style.playlists}>
					<div className={Style.playlistHeader}>
						<h3>Playlists</h3>
						<button type="button" className={Style.newPlaylist}>
							<FaPlus />
						</button>
					</div>
					<div className={Style.playlistList}>
						{playlistsLoading
							? null
							: playlists?.map((playlist) => {
									return (
										<Link to={`/playlists/${playlist.id}`} key={playlist.id}>
											<img
												src={`${import.meta.env.VITE_API_URL}/playlists/${
													playlist.id
												}/cover`}
												alt="playlist cover"
											/>
											<p>{playlist.title}</p>
										</Link>
									);
								})}
					</div>
				</div>
			</div>
		</div>
	);
};
