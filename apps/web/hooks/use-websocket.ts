import { useEffect, useRef } from "react";
import { wsManager } from "@/lib/ws";

export function useWebSocket(channel: string | null, onMessage: (data: unknown) => void) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!channel) return;

    const handler = (data: unknown) => handlerRef.current(data);
    wsManager.subscribe(channel, handler);

    return () => {
      wsManager.unsubscribe(channel, handler);
    };
  }, [channel]);
}
