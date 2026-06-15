export function lamportsToSol(lamports: number) {
  return lamports / 1_000_000_000;
}


export function solToLamports(  amount: number) {
  return amount * 1_000_000_000;
}