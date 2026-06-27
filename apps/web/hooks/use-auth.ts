"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState, useEffect } from "react";
import { api, setAccessToken, getAccessToken } from "@/lib/api";
import bs58 from "bs58";

export function useAuth() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getAccessToken());
  }, []);

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    setIsLoggingIn(true);
    try {
      const { nonce } = await api.get<{ nonce: string }>("/auth/nonce");
      const message = new TextEncoder().encode(nonce);
      const signature = await signMessage(message);
      const { token } = await api.post<{ token: string }>("/auth/wallet", {
        publicKey: publicKey.toBase58(),
        signature: bs58.encode(signature),
      });
      setAccessToken(token);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  }, [publicKey, signMessage]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort logout
    }
    setAccessToken(null);
    setIsAuthenticated(false);
    disconnect();
  }, [disconnect]);

  // Auto-login when wallet connects
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated && !isLoggingIn) {
      login();
    }
  }, [connected, publicKey, isAuthenticated, isLoggingIn, login]);

  return { isAuthenticated, isLoggingIn, login, logout };
}
