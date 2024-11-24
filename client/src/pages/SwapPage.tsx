import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useBalance } from "@/hooks/use-balance";
import { ArrowDown } from "lucide-react";

const swapSchema = z.object({
  fromCurrency: z.string().min(1),
  toCurrency: z.string().min(1),
  amount: z.string().min(1),
  autoSwap: z.boolean(),
});

export default function SwapPage() {
  const { toast } = useToast();
  const { data: balances } = useBalance();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      fromCurrency: "HBAR",
      toCurrency: "USDC",
      amount: "",
      autoSwap: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof swapSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to swap currencies");
      }

      toast({
        title: "Success",
        description: "Currency swapped successfully",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to swap currencies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Swap Currencies</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-4">
            <FormField
              control={form.control}
              name="fromCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <CurrencySelect
                      value={field.value}
                      onValueChange={field.onChange}
                      excludeCurrency={form.watch("toCurrency")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-center my-4">
              <ArrowDown className="w-6 h-6" />
            </div>

            <FormField
              control={form.control}
              name="toCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <CurrencySelect
                      value={field.value}
                      onValueChange={field.onChange}
                      excludeCurrency={form.watch("fromCurrency")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="any" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoSwap"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Auto-swap incoming HBAR to USDC</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Swapping..." : "Swap"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
