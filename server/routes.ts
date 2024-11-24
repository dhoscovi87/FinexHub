import { Express } from "express";
import { db } from "../db";
import { wallets, transactions } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql`count(*)::int` })
        .from(transactions)
        .where(eq(transactions.userId, userId));

      // Get paginated transactions sorted by newest first
      const history = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json({
        data: history,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
          hasMore: offset + history.length < count
        }
      });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      res.status(500).json({ 
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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
