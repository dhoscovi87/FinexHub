import { Balance } from "@/components/Balance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Send, ArrowDownLeft, Repeat, Wallet } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">My Wallet</h1>
      
      <Balance />
      
      <div className="grid grid-cols-2 gap-4">
        <Link href="/send">
          <Button className="w-full h-24 flex flex-col items-center justify-center space-y-2">
            <Send className="h-6 w-6" />
            <span>Send</span>
          </Button>
        </Link>
        
        <Link href="/receive">
          <Button className="w-full h-24 flex flex-col items-center justify-center space-y-2">
            <ArrowDownLeft className="h-6 w-6" />
            <span>Receive</span>
          </Button>
        </Link>
        
        <Link href="/swap">
          <Button className="w-full h-24 flex flex-col items-center justify-center space-y-2">
            <Repeat className="h-6 w-6" />
            <span>Swap</span>
          </Button>
        </Link>
        
        <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
          <Wallet className="h-6 w-6" />
          <span>Cash Out</span>
        </Button>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <TransactionHistory limit={5} />
      </Card>
    </div>
  );
}
