import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@db/schema";

interface TransactionListParams {
  limit?: number;
  page?: number;
}

interface TransactionResponse {
  data: Transaction[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

async function fetchTransactions({ limit, page }: TransactionListParams = {}): Promise<TransactionResponse> {
  const url = new URL("/api/transactions", window.location.origin);
  if (limit) {
    url.searchParams.append("limit", limit.toString());
  }
  if (page) {
    url.searchParams.append("page", page.toString());
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch transactions: ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Transaction fetch error:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch transactions");
  }
}

export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchTransactions(params),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    staleTime: 1000 * 60, // Consider data stale after 1 minute
  });
}
