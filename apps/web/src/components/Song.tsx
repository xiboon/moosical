import type { PlaylistSong, Song as SongType } from "@moosical/types";
import { useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import Style from "../styles/SongList.module.scss";
import { convertDuration } from "../utils/convertDuration";
const dateFormatter = new Intl.RelativeTimeFormat("en", {
	localeMatcher: "best fit",
	numeric: "auto",
	style: "short",
});
export const Song: React.FC<{
	song: SongType | PlaylistSong;
	currentSongs: (SongType | PlaylistSong)[];
	currentSong: number;
	isPlaying: boolean;
	playlist: string;
	play: () => void;
	setQueueId: (id: number, type: string, fetch: boolean) => Promise<void>;
	setQueue: (queue: number[]) => void;
	setSongId: (id: number) => void;
	pause: () => void;
}> = ({
	song,
	currentSongs,
	currentSong,
	isPlaying,
	play,
	setQueue,
	setSongId,
	pause,
	setQueueId,
	playlist: playlistId,
}) => {
	if (!song) return null;

	const [hovered, setHovered] = useState(false);
	return (
		<div
			key={song.id}
			className={Style.song}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<p className={Style.number}>
				{hovered ? (
					<button
						onClick={() => {
							if (currentSong === song.id && isPlaying) return pause();
							if (currentSong === song.id && !isPlaying) return play();
							const queue = currentSongs
								.map((e) => e.id)
								.slice(currentSongs.indexOf(song) + 1);
							setSongId(song.id);
							setQueue(queue);
							play();
							setQueueId(Number(playlistId), "playlist", false);
						}}
						type="button"
					>
						{currentSong === song.id && isPlaying ? <FaPause /> : <FaPlay />}
					</button>
				) : (
					// @ts-expect-error
					song.position || song.positionOnAlbum
				)}
			</p>
			<p
				className={Style.title}
				style={{
					color: `${currentSong === song.id ? "var(--color-primary)" : ""}`,
				}}
			>
				<img
					loading="lazy"
					src={`${import.meta.env.VITE_API_URL}/songs/${song.id}/cover`}
					alt={"song cover"}
				/>
				{song.title}
			</p>
			<p className={Style.artist}>
				{song.artist.name}
				{song.featuredArtists.length !== 0
					? `, ${song.featuredArtists.map((e) => e.name).join(", ")}`
					: ""}
			</p>
			{playlistId ? <p className={Style.album}>{song.album?.title}</p> : null}
			{playlistId ? (
				<p className={Style.timeAdded}>
					{dateFormatter.format(
						Math.round(
							// @ts-expect-error
							(new Date(song.timeAdded).getTime() - Date.now()) /
								1000 /
								60 /
								60 /
								24,
						),
						"day",
					)}
				</p>
			) : null}
			<p className={Style.duration}>{convertDuration(song.duration)}</p>
		</div>
	);
};
