import type React from "react";
import Style from "../styles/SongList.module.scss";
export const SongList: React.FC<{ playlist: boolean }> = ({ playlist }) => {
	return (
		<div className={Style.list}>
			<div className={Style.header}>
				<p>#</p>
				<p>Title</p>
				<p>Artist</p>
				<p>Album</p>
				{playlist ? <p>Duration</p> : null}
				<p>Duration</p>
			</div>
		</div>
	);
};
