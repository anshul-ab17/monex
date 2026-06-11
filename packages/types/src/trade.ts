export interface TradeMatch {
  tradeId: string;
  marketId: string;

  buyOrderId: string;
  sellOrderId: string;

  price: string;
  quantity: string;

  timestamp: string;
}