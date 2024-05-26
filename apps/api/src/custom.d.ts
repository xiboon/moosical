import type { PrismaClient } from "@prisma/client";
import type { LyricsProvider } from "./classes/LyricsProvider";
import type { SongIndexer } from "./classes/SongIndexer";
import type { SongManager } from "./classes/SongManager";
import type { Transformers } from "./classes/Transformers";
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
