import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SWRConfig } from "swr";
import { Navbar } from "./components/Navbar";
import { Player } from "./components/Player";
import { Auth } from "./routes/auth";
import { Playlist } from "./routes/playlist";
import { Root } from "./routes/root";
import "./styles/input.scss";

export const App: React.FC = () => {
	console.log(import.meta.env);
	return (
		<SWRConfig
			value={{
				fetcher: async (url) => {
					const data = await fetch(import.meta.env.VITE_API_URL + url, {
						credentials: "include",
					});
					if (data.ok) return data.json();
					const error = new Error("An error occurred while fetching the data.");
					// @ts-expect-error
					error.info = await data.json();
					// @ts-expect-error
					error.status = data.status;
					throw error;
				},
				refreshInterval: 60000,
				provider: () => new Map(),
			}}
		>
			<BrowserRouter>
				<Navbar />
				<Player />
				<div className="main-content">
					<Routes>
						<Route path="/" element={<Root />} />
						<Route path="/auth" element={<Auth />} />
						<Route path="/playlists">
							<Route path=":id" element={<Playlist />} />
						</Route>
					</Routes>
				</div>
			</BrowserRouter>
		</SWRConfig>
	);
};
