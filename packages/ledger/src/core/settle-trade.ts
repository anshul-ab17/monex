export interface SettleTradeInput {
    tradeId: string;
    buyerId: string;
    sellerId: string;
    baseAssetId: string;
    quoteAssetId: string;
    quantity: string;
    price: string;
    makerFee: string;
    takerFee: string;
    takerSide: "BUY" | "SELL";
}
