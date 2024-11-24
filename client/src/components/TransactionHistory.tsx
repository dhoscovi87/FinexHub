import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, ChevronDown, ChevronUp, Search } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import * as Collapsible from "@radix-ui/react-collapsible";

interface TransactionHistoryProps {
  limit?: number;
}

export function TransactionHistory({ limit }: TransactionHistoryProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({});
  
  const { data, isLoading, isError, error } = useTransactions({ 
    limit,
    search: debouncedSearch || undefined
  });

  const groupedTransactions = useMemo(() => {
    if (!data?.data) return [];
    
    const groups: {date: Date; transactions: typeof data.data}[] = [];
    let currentGroup: typeof groups[0] | null = null;
    
    data.data.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      
      if (!currentGroup || !isSameDay(currentGroup.date, txDate)) {
        currentGroup = { date: txDate, transactions: [] };
        groups.push(currentGroup);
      }
      
      currentGroup.transactions.push(tx);
    });
    
    return groups;
  }, [data?.data]);

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-4">
          <div className="h-12 bg-muted rounded" />
        </Card>
      ))}
    </div>;
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
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {groupedTransactions.map((group) => {
          const dateStr = format(group.date, "yyyy-MM-dd");
          const isOpen = openSections[dateStr] ?? true;
          
          return (
            <Card key={dateStr} className="overflow-hidden">
              <Button
                variant="ghost"
                className="w-full p-4 flex items-center justify-between hover:bg-accent"
                onClick={() => setOpenSections(prev => ({
                  ...prev,
                  [dateStr]: !isOpen
                }))}
              >
                <div className="font-medium">
                  {format(group.date, "MMMM d, yyyy")}
                  <span className="ml-2 text-muted-foreground">
                    ({group.transactions.length} transaction{group.transactions.length !== 1 ? "s" : ""})
                  </span>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              <Collapsible.Root open={isOpen} className="transition-all duration-300 ease-in-out">
                <Collapsible.Content className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                  <div className="divide-y">
                    {group.transactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {getIcon(tx.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(tx.createdAt), "HH:mm")}
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
                      </div>
                    ))}
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
