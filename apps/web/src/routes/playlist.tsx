import React from "react";
import { useParams } from "react-router-dom";
import Style from "../styles/Playlist.module.scss";
import { usePlaylist } from "../utils/usePlaylist";
export const Playlist: React.FC = () => {
	const params = useParams();
	// TODO: make this an error
	if (!params?.id) return null;
	const id = parseInt(params?.id);
	if (Number.isNaN(id)) return null;
	const { playlist, isLoading } = usePlaylist(id);
	if (isLoading) return null;
	console.log(playlist);
	const img = `${import.meta.env.VITE_API_URL}/playlists/${playlist?.id}/cover`;
	return (
		<div className={Style.playlist}>
			<div
				className={Style.headerContainer}
				style={{ backgroundImage: `url(${img})` }}
			>
				<div className={Style.header}>
					<img src={img} alt="Playlist cover" />
					<div className={Style.info}>
						<h1>{playlist.title}</h1>
						<p>{playlist.description || "No description."}</p>
					</div>
				</div>
			</div>
		</div>
	);
};
