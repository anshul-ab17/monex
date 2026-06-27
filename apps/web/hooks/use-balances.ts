import { useQuery } from "@tanstack/react-query";
import { api, getAccessToken } from "@/lib/api";

export interface Balance {
  assetId: string;
  asset: { symbol: string; name: string };
  available: string;
  locked: string;
}

export function useBalances() {
  return useQuery({
    queryKey: ["balances"],
    queryFn: () => api.get<Balance[]>("/wallet/balances"),
    enabled: !!getAccessToken(),
    refetchInterval: 10_000,
  });
}
