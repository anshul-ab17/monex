import { NotFoundError } from "../../utils/errors";
import { findAllAssets, findAssetById, findAssetBySymbol } from "./asset.repository";

export const assetService = {
    list: findAllAssets,

    async getById(id: string) {
        const asset = await findAssetById(id);
        if (!asset) throw new NotFoundError(`Asset ${id} not found`);
        return asset;
    },

    async getBySymbol(symbol: string) {
        const asset = await findAssetBySymbol(symbol);
        if (!asset) throw new NotFoundError(`Asset ${symbol} not found`);
        return asset;
    },
};
