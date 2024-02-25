import { PrismaClient } from "@prisma/client";
import { SongManager } from "./classes/SongManager";
import { LyricsProvider } from "./classes/LyricsProvider";
import { SongIndexer } from "./classes/SongIndexer";
// biome-ignore lint/nursery/noUnusedImports: this is needed for the type augmentation to work properly
import { FastifyRequest, FastifyReply } from "fastify";
import { Transformers } from "./classes/Transformers";
declare module "fastify" {
	interface FastifyRequest extends FastifyRequest {
		db: PrismaClient;
		songManager: SongManager;
		songIndexer: SongIndexer;
		lyricsProvider: LyricsProvider;
		transformers: Transformers;
		userId: number;
		// biome-ignore lint: h
		jwtVerifier: (token: string | Buffer) => any;
	}
}
