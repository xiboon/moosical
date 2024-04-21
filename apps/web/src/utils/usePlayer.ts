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
	const [isPlaying, setIsPlaying] = useState(!audioElement.paused);
	const [muted, setMuted] = useState(audioElement.muted);
	const [queueId, setQueueIdState] = useState(0);

	let sortBy: "artistName" | "title" | "albumTitle" | "timeAdded" | "duration" =
		"timeAdded";
	let sortDirection: "asc" | "desc";

	let queueOffset = 0;
	let interval: number;
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
		audioElement.src = `${
			import.meta.env.VITE_API_URL
		}/songs/${id}/data?format=${format}`;
		// audioElement.src =
		// "http://localhost:8080/Kendrick%20Lamar/[E]%20%20Mr.%20Morale%20&%20The%20Big%20Steppers%20[230890860]%20[2022]/CD2/01%20-%20Kendrick%20Lamar%20-%20Count%20Me%20Out(Explicit).flac";
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

	function setSortBy(
		type: "artistName" | "title" | "albumTitle" | "timeAdded" | "duration",
	) {
		sortBy = type;
	}

	function setSortDirection(direction: "asc" | "desc") {
		sortDirection = direction;
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
		interval = setInterval(() => {
			setPositionState(audioElement.currentTime);
		}, 500);
	};

	audioElement.onpause = () => {
		setIsPlaying(false);
		clearInterval(interval);
	};
	audioElement.onerror = (e, v) => {
		console.log("error,", e, v);
	};
	audioElement.onended = async () => {
		next();
	};

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
