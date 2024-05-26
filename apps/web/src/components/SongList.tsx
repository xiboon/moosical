import type { PlaylistSong } from "@moosical/types";
import type React from "react";
import Style from "../styles/SongList.module.scss";
import { usePlaylist } from "../utils/usePlaylist";

export const SongList: React.FC<{ playlistId: number }> = ({ playlistId }) => {
	const { playlist } = usePlaylist(playlistId);
	const currentSongs = playlist ? playlist.songs : [];
	return (
		<div className={`${Style.list} ${playlist ? Style.playlist : null}`}>
			<div className={Style.header}>
				<p className={Style.number}>#</p>
				<p className={Style.title}>Title</p>
				<p className={Style.artist}>Artist</p>
				{playlist ? <p className={Style.album}>Album</p> : null}
				{playlist ? <p className={Style.timeAdded}>Time added</p> : null}
				<p className={Style.duration}>Duration</p>
				{currentSongs?.map((song: PlaylistSong) => {
					return (
						<div key={song.id} className={Style.song}>
							<p className={Style.number}>{song.id + 1}</p>
							<p className={Style.title}>{song.title}</p>
							<p className={Style.artist}>{song.artist.name}</p>
							{playlist ? (
								<p className={Style.album}>{song.album.title}</p>
							) : null}
							{playlist ? <p className={Style.timeAdded}>{song.id}</p> : null}
							<p className={Style.duration}>{song.duration}</p>
						</div>
					);
				})}
			</div>
		</div>
	);
};
