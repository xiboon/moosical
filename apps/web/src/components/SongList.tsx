import type { PlaylistSong, Song as SongType } from "@moosical/types";
import type React from "react";
import { useContext } from "react";
import Style from "../styles/SongList.module.scss";
import { PlayerContext } from "../utils/usePlayer";
import { Song } from "./Song";
export const SongList: React.FC<{
	playlist: string;
	currentSongs: SongType[];
	setCurrentSongs: React.Dispatch<React.SetStateAction<SongType[]>>;
}> = ({ playlist, currentSongs }) => {
	const player = useContext(PlayerContext);
	return (
		<div className={`${Style.list} ${playlist ? Style.playlist : null}`}>
			<div className={Style.header}>
				<p className={Style.number}>#</p>
				<p className={Style.title}>Title</p>
				<p className={Style.artist}>Artist</p>
				{playlist ? <p className={Style.album}>Album</p> : null}
				{playlist ? <p className={Style.timeAdded}>Time added</p> : null}
				<p className={Style.duration}>Duration</p>
			</div>
			{currentSongs?.map((song: PlaylistSong) => (
				<Song
					song={song}
					currentSong={player.songId}
					currentSongs={currentSongs}
					isPlaying={player.isPlaying}
					setQueueId={player.setQueueId}
					pause={player.pause}
					play={player.play}
					playlist={playlist}
					setQueue={player.setQueue}
					setSongId={player.setSongId}
					key={song.id}
				/>
			))}
		</div>
	);
};
