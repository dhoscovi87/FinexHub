import { Express } from "express";
import { db } from "../db";
import { wallets, transactions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  // Get user balances
  app.get("/api/balances", async (req, res) => {
    try {
      // Mock data - replace with actual implementation
      const rates = {
        hbar: 0.07, // USD per HBAR
        cfa: 0.0017 // USD per CFA
      };
      
      res.json({
        hbar: 100.5,
        usdc: 50.0,
        cfa: 25000,
        rates
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balances" });
    }
  });

  // Get transaction history
  app.get("/api/transactions", async (req, res) => {
    try {
      const userId = 1; // Replace with actual user ID from auth
      const history = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(transactions.createdAt)
        .limit(20);
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Send money
  app.post("/api/send", async (req, res) => {
    try {
      const { recipientPhone, amount, currency, note } = req.body;
      // Implementation here
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send money" });
    }
  });

  // Swap currencies
  app.post("/api/swap", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      // Implementation here
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to swap currencies" });
    }
  });
}
