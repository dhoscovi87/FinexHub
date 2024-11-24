import { useQuery } from "@tanstack/react-query";

interface Balances {
  hbar: number;
  usdc: number;
  cfa: number;
  rates: {
    hbar: number;
    cfa: number;
  };
}

async function fetchBalances(): Promise<Balances> {
  const response = await fetch("/api/balances");
  if (!response.ok) {
    throw new Error("Failed to fetch balances");
  }
  return response.json();
}

export function useBalance() {
  return useQuery({
    queryKey: ["balances"],
    queryFn: fetchBalances,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
