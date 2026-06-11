export interface AssetBalance {
  assetId: string;
  symbol: string;
  available: string;
  locked: string;
  total: string;
}

export interface AssetMetadata {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
}