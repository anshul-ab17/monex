import Decimal from "decimal.js";
import { redis } from "@repo/redis";

// Pyth Hermes REST endpoint (no SDK dependency)
const HERMES_URL = "https://hermes.pyth.network";
const CACHE_TTL = 5;

// Pyth price feed IDs (mainnet) — extend per asset
const PRICE_FEEDS: Record<string, string> = {
    "SOL/USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
};

interface PythPrice {
    price: string;
    conf: string;
    expo: number;
    publishTime: number;
}

export const oracleService = {
    async getPrice(pair: string): Promise<Decimal | null> {
        const cacheKey = `oracle:price:${pair}`;
        const cached = await redis.get(cacheKey);
        if (cached) return new Decimal(cached);

        const feedId = PRICE_FEEDS[pair];
        if (!feedId) return null;

        try {
            const res = await fetch(
                `${HERMES_URL}/v2/updates/price/latest?ids[]=${feedId}&parsed=true`,
            );
            if (!res.ok) return null;

            const data = await res.json() as { parsed: Array<{ price: PythPrice }> };
            if (!data.parsed?.length) return null;

            const { price, expo } = data.parsed[0]!.price;
            const decimal = new Decimal(price).mul(new Decimal(10).pow(expo));

            await redis.setex(cacheKey, CACHE_TTL, decimal.toString());
            return decimal;
        } catch {
            return null;
        }
    },

    async getMarkPrice(marketSymbol: string): Promise<Decimal | null> {
        // Map market symbol (e.g. "SOL-USDC") to Pyth pair (e.g. "SOL/USD")
        const base = marketSymbol.split("-")[0];
        if (!base) return null;
        return this.getPrice(`${base}/USD`);
    },

    async getAllPrices(): Promise<Record<string, string>> {
        const results: Record<string, string> = {};
        for (const pair of Object.keys(PRICE_FEEDS)) {
            const price = await this.getPrice(pair);
            if (price) results[pair] = price.toString();
        }
        return results;
    },

    getSupportedPairs(): string[] {
        return Object.keys(PRICE_FEEDS);
    },

    addPriceFeed(pair: string, feedId: string) {
        PRICE_FEEDS[pair] = feedId;
    },
};
