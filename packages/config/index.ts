import { z } from "zod";

class Env {
	private static instance: ReturnType<typeof Env.create>;
	private constructor() {}
	private	static create() {
		return z.object({
				DATABASE_URL: z.url(),
				JWT_SECRET: z.string().min(8),
				REDIS_URL: z.url(),
				PORT: z.coerce.number().default(3000),
				FRONTEND_URL: z.string().default("http://localhost:3001"),
				SOLANA_RPC_URL: z.string().default("https://api.devnet.solana.com"),
				SOLANA_MASTER_SECRET: z.string().optional(),
				USDC_MINT: z.string().default("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
				USDT_MINT: z.string().optional(),
				KAFKA_BROKER: z.string().default("localhost:9092"),
				USE_KAFKA: z.string().optional(),
		}).parse(Bun.env)
	}

	public static get(): ReturnType<typeof Env.create>{
		if(!this.instance){
			this.instance= this.create();
		}
		return this.instance;
	}
}

export const env = Env.get();
 