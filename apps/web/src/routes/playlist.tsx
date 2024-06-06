import type React from "react";
import { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { useParams } from "react-router-dom";
import { SongList } from "../components/SongList";
import Style from "../styles/Playlist.module.scss";
import { usePlaylist } from "../utils/usePlaylist";
export const Playlist: React.FC = () => {
	const params = useParams();
	// TODO: make this an error instead of returning nothing
	if (!params?.id) return null;
	const id = Number.parseInt(params?.id);
	if (Number.isNaN(id)) return null;
	const { playlist, isLoading } = usePlaylist(`${id}?songsBefore=50`);
	const [currentSongs, setCurrentSongs] = useState([]);
	const [initialSongsSet, setInitialSongsSet] = useState(false);
	useEffect(() => {
		setCurrentSongs(playlist?.songs.sort((a, b) => a.position - b.position));
		setInitialSongsSet(true);
	}, [playlist]);
	useEffect(() => {
		if (!initialSongsSet || !currentSongs) return;
		fetch(`${import.meta.env.VITE_API_URL}/playlists/${id}/songs?after=50`, {
			credentials: "include",
		})
			.then((res) => res.json())
			.then((data) => {
				setCurrentSongs(
					[...currentSongs, ...data].sort((a, b) => a.position - b.position),
				);
				setInitialSongsSet(false);
			});
	}, [initialSongsSet, currentSongs, id]);
	if (isLoading) return null;
	const img = `${import.meta.env.VITE_API_URL}/playlists/${playlist?.id}/cover`;

	return (
		<div className={Style.playlist}>
			<div
				className={Style.headerContainer}
				style={{ backgroundImage: `url(${img})` }}
			>
				<div className={Style.header}>
					<div className={Style.infoContainer}>
						<img src={img} alt="Playlist cover" />
						<div className={Style.info}>
							<h1>{playlist.title}</h1>
							<p>{playlist.description || "No description."}</p>
							<div className={Style.actions}>
								<button type="button" className={Style.playButton}>
									<FaPlay />
								</button>
								<button type="button" className={Style.detailsButton}>
									<HiDotsHorizontal />
								</button>
							</div>
						</div>
					</div>
				</div>
				<SongList
					playlist={playlist.id}
					currentSongs={currentSongs}
					setCurrentSongs={setCurrentSongs}
				/>
			</div>
		</div>
	);
};
