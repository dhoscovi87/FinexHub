import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet } from "lucide-react";
import { format } from "date-fns";

interface TransactionHistoryProps {
  limit?: number;
}

export function TransactionHistory({ limit }: TransactionHistoryProps) {
  const { data, isLoading, isError, error } = useTransactions({ limit });

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-destructive">
        Error: {error instanceof Error ? error.message : "Failed to load transactions"}
      </div>
    );
  }

  if (!data?.data?.length) {
    return <div className="text-center text-muted-foreground">No transactions yet</div>;
  }

  const transactions = data.data;

  const getIcon = (type: string) => {
    switch (type) {
      case "send": return <ArrowUpRight className="text-red-500" />;
      case "receive": return <ArrowDownLeft className="text-green-500" />;
      case "swap": return <RefreshCw className="text-blue-500" />;
      case "cashout": return <Wallet className="text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <Card key={tx.id} className="p-4 flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            {getIcon(tx.type)}
          </div>
          <div className="flex-1">
            <div className="font-medium">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {tx.type === "send" ? "-" : "+"}{tx.amount} {tx.currency}
            </div>
            <div className={`text-sm ${tx.status === "completed" ? "text-green-500" : "text-orange-500"}`}>
              {tx.status}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
