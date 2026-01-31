import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { v4 as uuidv4 } from "uuid";
import { dispatchTransferWebhooks } from "./webhooks/queue";

export interface TransferRequest {
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface TransferResult {
  success: boolean;
  transactionId?: string;
  message: string;
  fromBalance?: number;
  toBalance?: number;
}

// Core transfer logic implementing double-entry bookkeeping with idempotency and row-level locking for concurrency control 
export async function processTransfer(
  request: TransferRequest
): Promise<{ statusCode: number; body: TransferResult }> {
  const { idempotencyKey, fromAccountId, toAccountId, amount, description } =
    request;

  // Validate amount
  if (amount <= 0) {
    return {
      statusCode: 400,
      body: { success: false, message: "Amount must be positive" },
    };
  }

  if (fromAccountId === toAccountId) {
    return {
      statusCode: 400,
      body: { success: false, message: "Cannot transfer to same account" },
    };
  }

  // Step 1: Idempotency Gate
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existingKey) {
    // If completed, return cached response
    if (existingKey.completed && existingKey.responseBody) {
      return {
        statusCode: existingKey.responseCode || 200,
        body: existingKey.responseBody as unknown as TransferResult,
      };
    }

    // If still processing (locked but not completed), return conflict
    const lockAge =
      Date.now() - new Date(existingKey.lockedAt).getTime();
    const LOCK_TIMEOUT_MS = 30000; // 30 seconds

    if (lockAge < LOCK_TIMEOUT_MS) {
      return {
        statusCode: 409,
        body: {
          success: false,
          message: "Transaction is currently being processed",
        },
      };
    }

    // Lock expired, we can retry - delete stale lock
    await prisma.idempotencyKey.delete({ where: { key: idempotencyKey } });
  }

  // Create idempotency lock
  try {
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        lockedAt: new Date(),
        completed: false,
      },
    });
  } catch {
    // Race condition 
    return {
      statusCode: 409,
      body: {
        success: false,
        message: "Transaction is currently being processed",
      },
    };
  }

  // Step 2: Execute transfer in a transaction with row-level locking
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Sort account IDs to prevent deadlocks (always lock in same order)
        const sortedIds = [fromAccountId, toAccountId].sort();

        // Lock accounts with FOR UPDATE (row-level locking)
        const accounts = await tx.$queryRaw<
          Array<{ id: string; balance: Prisma.Decimal }>
        >`
        SELECT id, balance FROM "Account" 
        WHERE id IN (${Prisma.join(sortedIds)})
        ORDER BY id
        FOR UPDATE
      `;

        if (accounts.length !== 2) {
          throw new Error("One or both accounts not found");
        }

        const fromAccount = accounts.find((a) => a.id === fromAccountId);
        const toAccount = accounts.find((a) => a.id === toAccountId);

        if (!fromAccount || !toAccount) {
          throw new Error("Account mismatch");
        }

        // Check sufficient balance
        const fromBalance = Number(fromAccount.balance);
        if (fromBalance < amount) {
          throw new Error(
            `Insufficient balance. Available: ${fromBalance}, Required: ${amount}`
          );
        }

        // Generate transaction ID (groups debit and credit entries)
        const transactionId = uuidv4();

        // Update balances
        await tx.account.update({
          where: { id: fromAccountId },
          data: { balance: { decrement: amount } },
        });

        await tx.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: amount } },
        });

        // Create ledger entries (double-entry: debit sender, credit receiver)
        await tx.ledgerEntry.createMany({
          data: [
            {
              transactionId,
              accountId: fromAccountId,
              amount: -amount, // Debit (negative)
              description: description || `Transfer to ${toAccountId}`,
            },
            {
              transactionId,
              accountId: toAccountId,
              amount: amount, // Credit (positive)
              description: description || `Transfer from ${fromAccountId}`,
            },
          ],
        });

        // Get updated balances
        const updatedFrom = await tx.account.findUnique({
          where: { id: fromAccountId },
        });
        const updatedTo = await tx.account.findUnique({
          where: { id: toAccountId },
        });

        return {
          transactionId,
          fromBalance: Number(updatedFrom?.balance),
          toBalance: Number(updatedTo?.balance),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    // Step 3: Finalize - Update idempotency key with success
    const successBody: TransferResult = {
      success: true,
      transactionId: result.transactionId,
      message: "Transfer completed successfully",
      fromBalance: result.fromBalance,
      toBalance: result.toBalance,
    };

    await prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: {
        completed: true,
        responseCode: 200,
        responseBody: successBody as unknown as Prisma.JsonObject,
      },
    });

    // Dispatch webhooks for the successful transfer (async, non-blocking)
    dispatchTransferWebhooks(
      result.transactionId,
      fromAccountId,
      toAccountId,
      amount,
      result.fromBalance,
      result.toBalance
    ).catch((err) => console.error("Failed to dispatch webhooks:", err));

    return { statusCode: 200, body: successBody };
  } catch (error) {
    // Update idempotency key with failure
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const failureBody: TransferResult = {
      success: false,
      message: errorMessage,
    };

    await prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: {
        completed: true,
        responseCode: 400,
        responseBody: failureBody as unknown as Prisma.JsonObject,
      },
    });

    return { statusCode: 400, body: failureBody };
  }
}

// Get account balance and recent transactions
 export async function getAccountDetails(accountId: string) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      ledgerEntries: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return account;
}

// Get all accounts (for demo purposes)
export async function getAllAccounts() {
  return prisma.account.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// Create a new account
 export async function createAccount(userId: string, name: string, initialBalance: number = 0) {
  return prisma.account.create({
    data: {
      userId,
      name,
      balance: initialBalance,
    },
  });
}
