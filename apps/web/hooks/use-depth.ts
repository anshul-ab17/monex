import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DepthLevel {
  price: string;
  quantity: string;
}

export interface Depth {
  bids: DepthLevel[];
  asks: DepthLevel[];
}

export function useDepth(marketId: string) {
  return useQuery({
    queryKey: ["depth", marketId],
    queryFn: () => api.get<Depth>(`/markets/${marketId}/depth`),
    enabled: !!marketId,
    refetchInterval: 2_000,
  });
}
