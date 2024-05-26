import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePaths from "vite-tsconfig-paths"
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), vitePaths()],
	css: {
		modules: {
			localsConvention: "camelCase",
		},
	},
});
