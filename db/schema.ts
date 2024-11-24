import { pgTable, text, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: text("phone_number").unique().notNull(),
  pin: text("pin").notNull(),
  name: text("name").notNull(),
  language: text("language").default("fr").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  hbarBalance: decimal("hbar_balance", { precision: 18, scale: 8 }).default("0").notNull(),
  usdcBalance: decimal("usdc_balance", { precision: 18, scale: 8 }).default("0").notNull(),
  cfaBalance: decimal("cfa_balance", { precision: 18, scale: 8 }).default("0").notNull(),
  hbarAddress: text("hbar_address").notNull(),
  usdcAddress: text("usdc_address").notNull(),
  momoAccounts: jsonb("momo_accounts").$type<string[]>().default([]).notNull(),
});

export const transactions = pgTable("transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["send", "receive", "swap", "cashout"] }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency", { enum: ["HBAR", "USDC", "CFA"] }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
  recipientId: integer("recipient_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertWalletSchema = createInsertSchema(wallets);
export const selectWalletSchema = createSelectSchema(wallets);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

export type User = z.infer<typeof selectUserSchema>;
export type Wallet = z.infer<typeof selectWalletSchema>;
export type Transaction = z.infer<typeof selectTransactionSchema>;
