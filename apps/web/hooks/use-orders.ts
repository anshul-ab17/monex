import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getAccessToken } from "@/lib/api";

export interface Order {
  id: string;
  marketId: string;
  userId: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price: string;
  quantity: string;
  filledQuantity: string;
  status: string;
  timeInForce: string;
  createdAt: string;
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<Order[]>("/orders"),
    enabled: !!getAccessToken(),
    refetchInterval: 5_000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: {
      marketId: string;
      side: "BUY" | "SELL";
      type: "LIMIT" | "MARKET";
      price?: string;
      quantity: string;
      timeInForce?: string;
    }) => api.post<Order>("/orders", order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.del<void>(`/orders/${orderId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
