import { useBalance } from "@/hooks/use-balance";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function Balance() {
  const { data: balances, isLoading } = useBalance();
  
  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-12 w-32 mb-2" />
        <Skeleton className="h-6 w-24" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Tabs defaultValue="hbar">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hbar">HBAR</TabsTrigger>
          <TabsTrigger value="usdc">USDC</TabsTrigger>
          <TabsTrigger value="cfa">CFA</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hbar">
          <div className="text-3xl font-bold">{balances.hbar.toFixed(2)} ℏ</div>
          <div className="text-sm text-muted-foreground">
            ≈ ${(balances.hbar * balances.rates.hbar).toFixed(2)}
          </div>
        </TabsContent>
        
        <TabsContent value="usdc">
          <div className="text-3xl font-bold">${balances.usdc.toFixed(2)}</div>
        </TabsContent>
        
        <TabsContent value="cfa">
          <div className="text-3xl font-bold">{balances.cfa.toFixed(0)} CFA</div>
          <div className="text-sm text-muted-foreground">
            ≈ ${(balances.cfa * balances.rates.cfa).toFixed(2)}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
