import { useBalance } from "@/hooks/use-balance";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function Balance() {
  const { data: balances, isLoading } = useBalance();
  
  if (isLoading) {
    return (
      <Card className="p-4 md:p-6">
        <div className="md:flex md:items-start md:justify-between">
          <Skeleton className="h-12 w-32 mb-2 md:mb-0 md:h-16 md:w-48" />
          <Skeleton className="h-6 w-24 md:h-8 md:w-32" />
        </div>
      </Card>
    );
  }

  if (!balances) {
    return (
      <Card className="p-4 md:p-6">
        <div className="text-muted-foreground">Unable to load balance</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <Tabs defaultValue="hbar" className="md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:flex md:w-auto md:space-x-2">
          <TabsTrigger value="hbar" className="md:min-w-[100px]">HBAR</TabsTrigger>
          <TabsTrigger value="usdc" className="md:min-w-[100px]">USDC</TabsTrigger>
          <TabsTrigger value="cfa" className="md:min-w-[100px]">CFA</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hbar" className="md:flex md:items-baseline md:justify-between">
          <div className="text-3xl md:text-4xl lg:text-5xl font-bold transition-all">
            {balances.hbar.toFixed(2)} ℏ
          </div>
          <div className="text-sm md:text-base text-muted-foreground">
            ≈ ${(balances.hbar * balances.rates.hbar).toFixed(2)}
          </div>
        </TabsContent>
        
        <TabsContent value="usdc" className="md:flex md:items-baseline md:justify-between">
          <div className="text-3xl md:text-4xl lg:text-5xl font-bold transition-all">
            ${balances.usdc.toFixed(2)}
          </div>
        </TabsContent>
        
        <TabsContent value="cfa" className="md:flex md:items-baseline md:justify-between">
          <div className="text-3xl md:text-4xl lg:text-5xl font-bold transition-all">
            {balances.cfa.toFixed(0)} CFA
          </div>
          <div className="text-sm md:text-base text-muted-foreground">
            ≈ ${(balances.cfa * balances.rates.cfa).toFixed(2)}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
