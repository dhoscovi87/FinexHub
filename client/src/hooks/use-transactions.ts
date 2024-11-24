import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@db/schema";

interface TransactionListParams {
  limit?: number;
}

async function fetchTransactions({ limit }: TransactionListParams = {}): Promise<Transaction[]> {
  const url = new URL("/api/transactions", window.location.origin);
  if (limit) {
    url.searchParams.append("limit", limit.toString());
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return response.json();
}

export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchTransactions(params),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
