import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBalance } from "@/hooks/use-balance";

export default function ReceivePage() {
  const { toast } = useToast();
  const { data: balances } = useBalance();
  const [currency, setCurrency] = useState("HBAR");
  const [amount, setAmount] = useState("");
  const [paymentLink, setPaymentLink] = useState("");

  useEffect(() => {
    // Generate payment link based on currency and amount
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      currency,
      amount: amount || "0",
    });
    setPaymentLink(`${baseUrl}/pay?${params.toString()}`);
  }, [currency, amount]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "Copied to clipboard",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: "Receive Payment",
        text: "Please send payment using this link:",
        url: paymentLink,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to share",
      });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Receive Money</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Currency</label>
          <CurrencySelect
            value={currency}
            onValueChange={setCurrency}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Amount (Optional)</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <Card className="p-6">
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={paymentLink} size={200} />
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => copyToClipboard(paymentLink)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Payment Link
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={share}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
