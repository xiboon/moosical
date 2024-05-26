import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.scss";

import { App } from "./App";

// biome-ignore lint: needed here
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);