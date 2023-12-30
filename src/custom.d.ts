import { PrismaClient } from "@prisma/client";
import { SongManager } from "./managers/SongManager";
import { LyricsProvider } from "./managers/LyricsProvider";
// biome-ignore lint/nursery/noUnusedImports: this is needed for the augmentation to work properly
import { FastifyRequest } from "fastify";
import { Transformers } from "./managers/Transformers";
declare module "fastify" {
	interface FastifyRequest extends FastifyRequest {
		db: PrismaClient;
		songManager: SongManager;
		lyricsProvider: LyricsProvider;
		musicPath: string;
		coverPath: string;
		transformers: Transformers;
	}
}
