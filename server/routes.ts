import { Express } from "express";
import { db } from "../db";
import { wallets, transactions } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { momoApi } from "./momo";

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
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      const baseQuery = db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      const searchCondition = search
        ? sql`(
            LOWER(type) LIKE ${`%${search.toLowerCase()}%`} OR 
            CAST(amount AS TEXT) LIKE ${`%${search}%`} OR
            LOWER(COALESCE(note, '')) LIKE ${`%${search.toLowerCase()}%`}
          )`
        : undefined;

      const finalQuery = searchCondition
        ? baseQuery.where(searchCondition)
        : baseQuery;

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(finalQuery.as("filtered_transactions"));

      const total = countResult?.count || 0;

      // Get paginated transactions sorted by newest first
      const history = await finalQuery
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json({
        data: history,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + history.length < total
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

  // MoMo API routes
  app.post("/api/momo/apiuser", async (req, res) => {
    try {
      const { callbackHost } = req.body;
      
      if (!callbackHost) {
        return res.status(400).json({ error: "callbackHost is required" });
      }

      const referenceId = momoApi.generateUUID();
      await momoApi.createApiUser(referenceId, callbackHost);
      
      const apiKey = await momoApi.createApiKey(referenceId);
      
      res.json({
        referenceId,
        apiKey
      });
    } catch (error) {
      console.error("MoMo API error:", error);
      res.status(500).json({ 
        error: "Failed to create MoMo API user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/momo/apiuser/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const details = await momoApi.getApiUserDetails(userId);
      res.json(details);
    } catch (error) {
      console.error("MoMo API error:", error);
      res.status(500).json({ 
        error: "Failed to get MoMo API user details",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
