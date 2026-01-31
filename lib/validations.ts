import { z } from "zod";

export const transferSchema = z.object({
  idempotencyKey: z.string().uuid("Invalid idempotency key format"),
  fromAccountId: z.string().min(1, "Sender account ID is required"),
  toAccountId: z.string().min(1, "Receiver account ID is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

export const createAccountSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Account name is required"),
  initialBalance: z.number().min(0, "Initial balance cannot be negative").optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
