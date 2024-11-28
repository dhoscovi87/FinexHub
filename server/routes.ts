import { Express } from "express";
import { db } from "../db";
import { wallets, transactions } from "@db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { momoApi } from "./momo";

const DEPOSIT_CALLBACK_URL = process.env.DEPOSIT_CALLBACK_URL || 'https://your-callback-url.com/momo/deposit';
const WITHDRAWAL_CALLBACK_URL = process.env.WITHDRAWAL_CALLBACK_URL || 'https://your-callback-url.com/momo/withdrawal';

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

      const conditions = [eq(transactions.userId, userId)];
      
      if (search) {
        conditions.push(
          sql`(
            LOWER(type) LIKE ${`%${search.toLowerCase()}%`} OR 
            CAST(amount AS TEXT) LIKE ${`%${search}%`} OR
            LOWER(COALESCE(note, '')) LIKE ${`%${search.toLowerCase()}%`}
          )`
        );
      }

      const query = db
        .select()
        .from(transactions)
        .where(and(...conditions));

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(...conditions));

      const total = countResult?.count || 0;

      // Get paginated transactions sorted by newest first
      const history = await query
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
  app.post("/api/momo/test-integration", async (req, res) => {
    try {
      // Step 1: Generate UUID for reference
      const referenceId = momoApi.generateUUID();
      console.log('Generated Reference ID:', referenceId);

      // Step 2: Create API user
      const callbackHost = process.env.DEPOSIT_CALLBACK_URL || req.get('origin') || 'http://localhost:5000';
      console.log('Using callback host:', callbackHost);
      
      await momoApi.createApiUser(referenceId, callbackHost);
      console.log('API User created successfully');

      // Step 3: Create API key
      const apiKey = await momoApi.createApiKey(referenceId);
      console.log('API Key created successfully');

      // Step 4: Get API user details
      const userDetails = await momoApi.getApiUserDetails(referenceId);
      console.log('API User details:', userDetails);

      res.json({
        success: true,
        message: 'MoMo API integration test successful',
        data: {
          referenceId,
          userDetails
        }
      });
    } catch (error) {
      console.error("MoMo API integration test failed:", error);
      res.status(500).json({ 
        error: "Failed to test MoMo API integration",
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

  // MoMo deposit endpoint
  app.post("/api/deposit/momo", async (req, res) => {
    try {
      const userId = 1; // Replace with actual authenticated user ID
      const { amount, phoneNumber, note } = req.body;

      if (!amount || !phoneNumber) {
        return res.status(400).json({ error: "Amount and phone number are required" });
      }

      // Create a pending transaction
      const [transaction] = await db
        .insert(transactions)
        .values({
          userId,
          type: "momo_deposit",
          amount,
          currency: "CFA",
          status: "pending",
          momoPhoneNumber: phoneNumber,
          note: note || "MoMo deposit",
        })
        .returning();

      // Request payment from user's mobile money account
      const referenceId = await momoApi.requestToPay(
        Number(amount),
        "EUR",
        phoneNumber,
        note || "MoMo deposit"
      );

      // Update transaction with reference ID
      await db
        .update(transactions)
        .set({ momoReferenceId: referenceId })
        .where(eq(transactions.id, transaction.id));

      // Start polling for payment status
      const checkPaymentStatus = async () => {
        try {
          const status = await momoApi.getPaymentStatus(referenceId);
          
          if (status.status !== "PENDING") {
            // Update transaction status
            await db.transaction(async (tx) => {
              const [updatedTx] = await tx
                .update(transactions)
                .set({
                  status: status.status === "SUCCESSFUL" ? "completed" : "failed",
                  momoStatus: status.status,
                })
                .where(eq(transactions.id, transaction.id))
                .returning();

              if (status.status === "SUCCESSFUL") {
                // Update wallet balance
                await tx
                  .update(wallets)
                  .set({
                    cfaBalance: sql`"cfa_balance" + ${updatedTx.amount}`,
                  })
                  .where(eq(wallets.userId, userId));
              }
            });
            return;
          }

          // Continue polling if still pending
          setTimeout(checkPaymentStatus, 5000);
        } catch (error) {
          console.error("Payment status check failed:", error);
        }
      };

      // Start the polling process
      setTimeout(checkPaymentStatus, 5000);

      res.json({
        message: "Deposit initiated",
        transactionId: transaction.id,
        referenceId
      });
    } catch (error) {
      console.error("MoMo deposit error:", error);
      res.status(500).json({
        error: "Failed to initiate deposit",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // MoMo withdrawal endpoint
  app.post("/api/withdraw/momo", async (req, res) => {
    try {
      const userId = 1; // Replace with actual authenticated user ID
      const { amount, phoneNumber, note } = req.body;

      if (!amount || !phoneNumber) {
        return res.status(400).json({ error: "Amount and phone number are required" });
      }

      // Check if user has sufficient balance
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .limit(1);

      if (!wallet || wallet.cfaBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Create a pending transaction
      const [transaction] = await db
        .insert(transactions)
        .values({
          userId,
          type: "momo_withdrawal",
          amount,
          currency: "CFA",
          status: "pending",
          momoPhoneNumber: phoneNumber,
          note: note || "MoMo withdrawal",
        })
        .returning();

      // Initialize transfer to user's mobile money account
      const referenceId = await momoApi.transfer(
        Number(amount),
        "EUR",
        phoneNumber,
        note || "MoMo withdrawal"
      );

      // Update transaction with reference ID
      await db
        .update(transactions)
        .set({ momoReferenceId: referenceId })
        .where(eq(transactions.id, transaction.id));

      // Start polling for transfer status
      const checkTransferStatus = async () => {
        try {
          const status = await momoApi.getTransferStatus(referenceId);
          
          if (status.status !== "PENDING") {
            // Update transaction status
            await db.transaction(async (tx) => {
              const [updatedTx] = await tx
                .update(transactions)
                .set({
                  status: status.status === "SUCCESSFUL" ? "completed" : "failed",
                  momoStatus: status.status,
                })
                .where(eq(transactions.id, transaction.id))
                .returning();

              if (status.status === "SUCCESSFUL") {
                // Update wallet balance
                await tx
                  .update(wallets)
                  .set({
                    cfaBalance: sql`"cfa_balance" - ${updatedTx.amount}`,
                  })
                  .where(eq(wallets.userId, userId));
              }
            });
            return;
          }

          // Continue polling if still pending
          setTimeout(checkTransferStatus, 5000);
        } catch (error) {
          console.error("Transfer status check failed:", error);
        }
      };

      // Start the polling process
      setTimeout(checkTransferStatus, 5000);

      res.json({
        message: "Withdrawal initiated",
        transactionId: transaction.id,
        referenceId
      });
    } catch (error) {
      console.error("MoMo withdrawal error:", error);
      res.status(500).json({
        error: "Failed to initiate withdrawal",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
