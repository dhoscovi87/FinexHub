import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const depositSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  phoneNumber: z.string().min(8, "Valid phone number is required"),
  note: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface MomoDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MomoDepositDialog({ open, onOpenChange }: MomoDepositDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      phoneNumber: "",
      note: "",
    },
  });

  const onSubmit = async (values: DepositFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/deposit/momo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("Mobile Money service is currently unavailable. Please try again later.");
        }
        throw new Error(data.details || data.error || "Failed to initiate deposit");
      }

      toast({
        title: "Deposit Initiated",
        description: "Please check your phone for the payment prompt.",
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate deposit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit via Mobile Money</DialogTitle>
          <DialogDescription>
            Enter your phone number and the amount you want to deposit.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+229" />
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
                  <FormLabel>Amount (CFA)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" step="1" />
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Processing..." : "Deposit"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
