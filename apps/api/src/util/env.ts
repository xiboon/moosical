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
	DATABASE_URL: {
		type: "string",
		optional: false,
	},
	MUSIC_PATH: {
		type: "string",
		optional: false,
		parser(input) {
			return input.startsWith("/") ? input : join(`${mainDir}/../../`, input);
		},
	},
	IMAGE_PATH: {
		type: "string",
		optional: false,
		parser(input) {
			return input.startsWith("/") ? input : join(`${mainDir}/../..`, input);
		},
	},
	LYRICS_PATH: {
		type: "string",
		optional: false,
		parser(input) {
			return input.startsWith("/") ? input : join(`${mainDir}/../..`, input);
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
	let envFile = await readFile(join(mainDir, "..", ".env"), "utf-8");
	envFile =
		envFile.match(/[#]*^JWT_SECRET=.*/) === null
			? `${envFile}\nJWT_SECRET="${env.JWT_SECRET}"`
			: envFile.replace(/[#]*^JWT_SECRET=.*/, `JWT_SECRET="${env.JWT_SECRET}"`);
	await writeFile(join(mainDir, "..", ".env"), envFile);
}
