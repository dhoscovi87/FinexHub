import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/CurrencySelect";
import { useToast } from "@/hooks/use-toast";
import { useBalance } from "@/hooks/use-balance";

const sendMoneySchema = z.object({
  recipientPhone: z.string().min(8, "Phone number is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  note: z.string().optional(),
});

export default function SendMoneyPage() {
  const { toast } = useToast();
  const { data: balances } = useBalance();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      recipientPhone: "",
      amount: "",
      currency: "HBAR",
      note: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof sendMoneySchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to send money");
      }

      toast({
        title: "Success",
        description: "Money sent successfully",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send money",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Send Money</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="recipientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="+229" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <CurrencySelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Add a note" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Money"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
