import { NotFoundError } from "../../utils/errors";
import { findAllMarkets, findMarketById, findMarketBySymbol } from "./market.repository";

export const marketService = {
    list: () => findAllMarkets(true),

    async getById(id: string) {
        const market = await findMarketById(id);
        if (!market) throw new NotFoundError(`Market ${id} not found`);
        return market;
    },

    async getBySymbol(symbol: string) {
        const market = await findMarketBySymbol(symbol);
        if (!market) throw new NotFoundError(`Market ${symbol} not found`);
        return market;
    },

    async assertActive(id: string) {
        const market = await findMarketById(id);
        if (!market) throw new NotFoundError(`Market ${id} not found`);
        if (!market.isActive) throw new Error(`Market ${id} is not active`);
        return market;
    },
};
