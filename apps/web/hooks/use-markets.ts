import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Market {
  id: string;
  baseAssetId: string;
  quoteAssetId: string;
  baseAsset: { id: string; symbol: string; name: string };
  quoteAsset: { id: string; symbol: string; name: string };
}

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => api.get<Market[]>("/markets"),
    staleTime: 60_000,
  });
}

export function useMarket(id: string) {
  return useQuery({
    queryKey: ["market", id],
    queryFn: () => api.get<Market>(`/markets/${id}`),
    enabled: !!id,
  });
}
