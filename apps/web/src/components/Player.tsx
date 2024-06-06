import Slider from "rc-slider";
import type React from "react";
import { type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { IoIosRepeat, IoIosShuffle } from "react-icons/io";
import {
	IoPause,
	IoPlay,
	IoPlaySkipBack,
	IoPlaySkipForward,
} from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";
import Style from "../styles/Player.module.scss";
import { convertDuration } from "../utils/convertDuration";
import { PlayerContext } from "../utils/usePlayer";
import { usePlaylist } from "../utils/usePlaylist";
import { useSong } from "../utils/useSong";
export const Player: React.FC = () => {
	const location = useLocation();
	const player = useContext(PlayerContext);
	const playerBar = useRef(null);
	if (location.pathname === "/auth") return null;
	const { song } = useSong(player.songId);
	const { song: queueSong } =
		player.queueType === "song" ? useSong(player.queueId) : { song: null };
	const { playlist: queuePlaylist } =
		player.queueType === "playlist"
			? usePlaylist(player.queueId)
			: { playlist: null };
	// this is to be removed

	useEffect(() => {
		if (playerBar.current && song) {
			requestAnimationFrame(() => {
				playerBar.current.style.width = `${
					(player.position / song.duration) * 100
				}%`;
			});
		}
	}, [song, player.position]);
	const [playingFrom, setPlayingFrom] = useState<ReactNode>();
	useEffect(() => {
		if (!player.queueId) return;
		let cutOff: string;
		console.log(player.queueType, player.queueId);
		switch (player.queueType) {
			case "song":
				if (!queueSong) return;
				cutOff = queueSong?.title.length > 30 ? "..." : "";
				setPlayingFrom(
					<Link to={`/songs/${player.queueId}`}>
						{queueSong?.title.slice(0, 30) + cutOff}
					</Link>,
				);
				break;
			case "album":
				cutOff = song.album?.title.length > 30 ? "..." : "";
				setPlayingFrom(
					<Link to={`/albums/${player.queueId}`}>
						{song.album?.title.slice(0, 30) + cutOff}
					</Link>,
				);
				break;
			case "playlist":
				console.log(queuePlaylist);
				if (!queuePlaylist) return;
				cutOff = queuePlaylist?.title.length > 30 ? "..." : "";

				setPlayingFrom(
					<Link to={`/playlists/${player.queueId}`}>
						{queuePlaylist?.title.slice(0, 30) + cutOff}
					</Link>,
				);
				break;
		}
	}, [player.queueId, player.queueType, queueSong, song?.album, queuePlaylist]);
	if (!player.queueId || !player.songId) return null;

	const img = `${import.meta.env.VITE_API_URL}/songs/${song?.id}/cover`;
	return (
		<div>
			<div
				className={`${Style.playerContainer} player`}
				style={{ backgroundImage: `url(${img})` }}
			/>

			<div className={Style.player}>
				<div className={Style.songInfo}>
					<img
						src={`${import.meta.env.VITE_API_URL}/songs/${song?.id}/cover`}
						alt="Song cover"
					/>
					<div>
						<h3>{song?.title}</h3>
						<p className={Style.artist}>
							{song?.artist?.name}
							{song?.featuredArtists?.length !== 0 ? "," : ""}{" "}
							{song?.featuredArtists?.map((e) => e.name).join(", ")}
						</p>
						<p className={Style.playingFrom}>
							{/* hi fix me */}
							Playing from: {playingFrom}
						</p>
					</div>
				</div>
				<div className={Style.playerControls}>
					<div className={Style.icons}>
						<IoIosShuffle
							className={Style.shuffle}
							style={{
								backgroundColor: player.shuffle ? "rgba(0, 0, 0, 30%)" : "",
							}}
							onClick={() => player.setShuffle(!player.shuffle)}
						/>
						<IoPlaySkipBack className={Style.skipBack} onClick={player.back} />
						{player.isPlaying ? (
							<IoPause className={Style.play} onClick={player.pause} />
						) : (
							<IoPlay className={Style.play} onClick={player.play} />
						)}
						<IoPlaySkipForward
							className={Style.skipForward}
							onClick={player.next}
						/>
						<IoIosRepeat
							className={Style.repeat}
							style={{
								backgroundColor: player.repeat ? "rgba(0, 0, 0, 30%)" : "",
							}}
							onClick={() => player.setRepeat(!player.repeat)}
						/>
					</div>
					<div className={Style.progress}>
						<p>{convertDuration(Math.round(player.position))}</p>
						{/* <div className={Style.progressBar}>
						<div className={Style.progressFill} ref={playerBar} />
					</div> */}
						<Slider
							className={Style.progressBar}
							min={0}
							max={song?.duration || 100}
							value={player?.position}
							onChange={player.setPosition}
						/>
						<p>{convertDuration(song?.duration || 100)}</p>
					</div>
				</div>

				<div className={Style.controls}>
					{/* <Slider
					range
					min={0}
					className={Style.volume}
					defaultValue={[player.volume * 100]}
					max={100}
					onChange={(value) => player.setVolume(value[0] / 100)}
					draggableTrack
				/> */}
					{player.muted ? (
						<HiSpeakerXMark onClick={player.mute} />
					) : (
						<HiSpeakerWave onClick={player.mute} />
					)}
					<Slider
						min={0}
						max={100}
						value={player.muted ? 0 : player.volume * 100}
						defaultValue={[player.volume * 100]}
						// @ts-expect-error
						onChange={(value) => player.setVolume(value[0] || value / 100)}
					/>
				</div>
			</div>
		</div>
	);
};
