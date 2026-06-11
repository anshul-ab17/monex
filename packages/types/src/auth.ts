export interface JwtPayload {
  sub: string;
  walletAddress: string;
}

export interface AuthSession {
  userId: string;
  walletAddress: string;
}