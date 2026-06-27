import { create } from "zustand";

interface TradingState {
  selectedMarketId: string;
  setSelectedMarketId: (id: string) => void;
  orderSide: "BUY" | "SELL";
  setOrderSide: (side: "BUY" | "SELL") => void;
  orderPrice: string;
  setOrderPrice: (price: string) => void;
  orderQuantity: string;
  setOrderQuantity: (qty: string) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedMarketId: "",
  setSelectedMarketId: (id) => set({ selectedMarketId: id }),
  orderSide: "BUY",
  setOrderSide: (side) => set({ orderSide: side }),
  orderPrice: "",
  setOrderPrice: (price) => set({ orderPrice: price }),
  orderQuantity: "",
  setOrderQuantity: (qty) => set({ orderQuantity: qty }),
}));
