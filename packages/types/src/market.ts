export interface MarketTicker {
  marketId: string;
  lastPrice: string;
  volume24h: string;
}

export interface OrderBookLevel {
  price: string;
  quantity: string;
}