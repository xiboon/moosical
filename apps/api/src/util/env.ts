import crypto from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createEnv } from "neon-env";

const mainDir = `${import.meta.url
	.replace("file://", "")
	.split("/")
	.slice(0, -1)
	.join("/")}/../../../`;

let generatedJwt = false;
const secret = crypto.randomBytes(64).toString("hex");

export const env = createEnv({
	PORT: {
		type: "number",
		default: 3000,
	},
	CORS_ORIGIN: {
		type: "string",
	},
	DATABASE_URL: {
		type: "string",
		optional: false,
	},
	MUSIC_PATH: {
		type: "string",
		optional: false,
		parser(input) {
			return input.startsWith("/") ? input : join(`${mainDir}/..`, input);
		},
	},
	ROOT_PASSWORD: {
		type: "string",
		default: "root",
	},
	IMAGE_PATH: {
		type: "string",
		optional: false,
		parser(input) {
			return input.startsWith("/") ? input : join(`${mainDir}/..`, input);
		},
	},
	LYRICS_PATH: {
		type: "string",
		optional: false,
		parser(input) {
			return input.startsWith("/") ? input : join(`${mainDir}/..`, input);
		},
	},
	GENIUS_TOKEN: {
		type: "string",
		optional: false,
	},
	DISCOGS_TOKEN: {
		type: "string",
		optional: false,
	},
	ENABLE_REGISTERING: {
		type: "boolean",
		optional: true,
	},
	JWT_SECRET: {
		type: "string",
		default: secret,
		parser(input) {
			if (input.length < 32) {
				generatedJwt = true;
				return secret;
			}
			return input;
		},
	},
	SAVE_TRANSCODED: {
		type: "boolean",
		default: true,
	},
} as const);

if (generatedJwt || env.JWT_SECRET === secret) {
	console.log(
		"Generating new JWT secret because it was not set or was too short.",
	);
	let replaced = false;
	const envFile = await readFile(join(mainDir, "..", ".env"), "utf-8");
	const data = envFile.split("\n").map((e) => {
		if (replaced) return e;
		if (e.trim().startsWith("#")) return e;
		const [key, value] = e.split("=");
		if (!key || !value) return e;
		if (key === "JWT_SECRET") {
			replaced = true;
			return `${key}="${secret}"`;
		}
		return e;
	});
	if (!replaced) data.push(`JWT_SECRET="${secret}"`);
	// envFile =
	// 	envFile.match(/[#]*^JWT_SECRET=.*/) === null
	// 		? `${envFile}\nJWT_SECRET="${env.JWT_SECRET}"`
	// 		: envFile.replace(/[#]*^JWT_SECRET=.*/, `JWT_SECRET="${env.JWT_SECRET}"`);
	await writeFile(join(mainDir, "..", ".env"), data.join("\n"));
}
