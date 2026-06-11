export interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  createdAt: Date;
}