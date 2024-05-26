import { useState } from "react";

export const audioElement = new Audio();

export function usePlayer() {
	const [duration, setDuration] = useState(audioElement.duration);
	const [position, setPositionState] = useState(audioElement.currentTime);
	const [queue, setQueue] = useState<number[]>([]);
	const [queueType, setQueueType] = useState<"playlist" | "song" | "album">(
		"song",
	);
	const [previousSongs, setPreviousSongs] = useState<number[]>([]);
	const [shuffle, setShuffle] = useState(false);
	const [repeat, setRepeat] = useState(false);
	const [songId, setSongIdState] = useState(0);
	const [volume, setVolumeState] = useState(audioElement.volume);
	const [format, setFormat] = useState("original");
	const [quality, setQuality] = useState<number>();
	const [isPlaying, setIsPlaying] = useState(!audioElement.paused);
	const [muted, setMuted] = useState(audioElement.muted);
	const [queueId, setQueueIdState] = useState(0);

	const [sortBy, setSortBy] = useState<
		"artistName" | "title" | "albumTitle" | "timeAdded" | "duration"
	>("timeAdded");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	let queueOffset = 0;
	
	function back() {
		setQueue([songId, ...queue]);
		if (position > 5) return setPosition(0);
		const arr = previousSongs;
		const last = arr.pop();
		if (last) {
			setSongId(last);
			setPreviousSongs(arr);
			audioElement.play();
		}
	}
	function setPosition(position: number) {
		setPositionState(position);
		audioElement.currentTime = position;
	}

	function setSongId(id: number) {
		setSongIdState(id);
		console.log(quality, Number.isNaN(quality));
		audioElement.src = `${
			import.meta.env.VITE_API_URL
		}/songs/${id}/data?format=${format}${quality === undefined ? "" : `&quality=${quality}`}`;
	}

	function play() {
		if (!audioElement.src) {
			return next();
		}
		audioElement.play();
	}

	function pause() {
		audioElement.pause();
	}

	async function next() {
		setPreviousSongs([...previousSongs, songId]);
		if (queue.length === 0) {
			await fetchQueue();
		}
		let ownQueue = queue;
		const first = ownQueue.shift();
		if (!first) {
			await fetchQueue();
			return next();
		}
		setSongId(first);
		audioElement.play();
		if (repeat && queueType === "song") ownQueue = [first];
		else if (repeat) ownQueue.push(first);
		setQueue(ownQueue);
	}

	function setQueueOffset(offset: number) {
		queueOffset = offset;
	}

	function setVolume(volume: number) {
		audioElement.volume = volume;
		setVolumeState(volume);
	}

	function mute() {
		setMuted(!audioElement.muted);
		audioElement.muted = !audioElement.muted;
	}

	function setQueueId(
		id: number,
		type: "playlist" | "song" | "album",
		shuffle = false,
		repeat = false,
		fetch = true,
	) {
		setQueueIdState(id);
		setShuffle(shuffle);
		setRepeat(repeat);
		setQueueType(type);
		return fetch ? fetchQueue(id, false) : null;
	}
	audioElement.onplay = () => {
		setIsPlaying(true);
	};

	audioElement.onpause = () => {
		setIsPlaying(false);
	};
	audioElement.onerror = (e, v) => {
		console.log("error,", e, v);
	};
	audioElement.onended = async () => {
		next();
	};
	audioElement.ontimeupdate = () => {
		setPositionState(audioElement.currentTime);
	
	}
	function fetchQueue(id?: number, append = false) {
		if (!queueId) setQueueId(id || songId, "song", false, false, false);
		if (queue.length === 0) {
			if (queueType === "playlist") {
				let url = `${import.meta.env.VITE_API_URL}/playlists/${
					id || queueId
				}/songs`;

				if (sortBy) {
					url += `?sort=${sortBy}`;
				}

				if (sortDirection) {
					url += `&sortDirection=${sortDirection}`;
				}

				if (shuffle) {
					url += "&shuffle=true";
				}

				if (queueOffset) {
					url += `&startFrom=${queueOffset}`;
				}
				return fetch(url, { credentials: "include" })
					.then((res) => res.json())
					.then((data) => {
						if (append) setQueue([...queue, ...data]);
						else setQueue(data);
						if (!songId) setSongId(data[0]);
					});
			}
			if (queueType === "song") {
				if (queueId === 0) return;
				const url = `${import.meta.env.VITE_API_URL}/songs/${queueId}/queue`;
				return fetch(url, { credentials: "include" })
					.then((res) => res.json())
					.then((data) => {
						// data.unshift(queueId);
						if (append) setQueue([...queue, ...data]);
						else setQueue(data);
						if (!songId) setSongId(queueId || data[0]);
					});
			}
		}
	}

	return {
		songId,
		duration,
		position,
		volume,
		isPlaying,
		repeat,
		setDuration,
		setVolume,
		play,
		next,
		pause,
		setShuffle,
		setPosition,
		setRepeat,
		setSongId,
		setQuality,
		quality,
		shuffle,
		setQueueOffset,
		setSortBy,
		setSortDirection,
		setQueueId,
		setQueue,
		muted,
		queueId,
		format,
		setFormat,
		queueType,
		setMuted,
		previousSongs,
		setPreviousSongs,
		mute,
		back,
	};
}
