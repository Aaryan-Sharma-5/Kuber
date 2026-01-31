import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import prisma from "../prisma";
import crypto from "crypto";

// Types
export interface WebhookJobData {
  deliveryId: string;
  webhookId: string;
  url: string;
  secret: string;
  payload: Record<string, unknown>;
  attempt: number;
}

// Lazy queue initialization
let webhookQueueInstance: Queue<WebhookJobData> | null = null;

function getWebhookQueue() {
  if (!webhookQueueInstance && typeof window === 'undefined') {
    // Only create queue in server environment and when Redis is configured
    try {
      webhookQueueInstance = new Queue<WebhookJobData>("webhooks", {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 5, 
          backoff: {
            type: "exponential",
            delay: 1000, // Initial delay of 1 second, will double with each attempt
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
        },
      });
    } catch (error) {
      console.warn("Redis not available - webhooks disabled:", (error as Error).message);
      return null;
    }
  }
  return webhookQueueInstance;
}

// Calculate HMAC signature for webhook payload
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Create a webhook worker to process deliveries
export function createWebhookWorker() {
  const queue = getWebhookQueue();
  if (!queue) {
    throw new Error("Redis connection required for webhook worker");
  }
  
  const worker = new Worker<WebhookJobData>(
    "webhooks",
    async (job: Job<WebhookJobData>) => {
      const { deliveryId, url, secret, payload, attempt } = job.data;

      console.log(`Webhook delivery attempt ${attempt + 1} for ${deliveryId}`);

      // Update delivery status
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: attempt + 1,
          lastAttemptAt: new Date(),
          status: "pending",
        },
      });

      // Prepare request
      const payloadString = JSON.stringify(payload);
      const signature = signPayload(payloadString, secret);
      const timestamp = Date.now();

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Kuber-Signature": signature,
            "X-Kuber-Timestamp": timestamp.toString(),
            "X-Kuber-Delivery-Id": deliveryId,
          },
          body: payloadString,
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        const responseBody = await response.text();

        if (response.ok) {
          // Success!
          await prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
              status: "success",
              responseCode: response.status,
              responseBody: responseBody.substring(0, 1000), // Limit stored response
            },
          });

          console.log(`Webhook delivered successfully: ${deliveryId}`);
          return { success: true, statusCode: response.status };
        }

        // Server returned an error - will retry
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            responseCode: response.status,
            responseBody: responseBody.substring(0, 1000),
            nextRetryAt: calculateNextRetry(attempt),
          },
        });

        throw new Error(`Server returned ${response.status}: ${responseBody}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Check if this is the last attempt
        if (attempt + 1 >= 5) {
          await prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
              status: "failed",
              responseBody: `Failed after 5 attempts: ${errorMessage}`,
            },
          });
          console.error(`Webhook delivery failed permanently: ${deliveryId}`);
        }

        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 10, // Process up to 10 webhooks simultaneously
    }
  );

  worker.on("completed", (job) => {
    console.log(`Webhook job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Webhook job ${job?.id} failed:`, error.message);
  });

  return worker;
}

// Calculate next retry time using exponential backoff
function calculateNextRetry(currentAttempt: number): Date {
  const delayMs = Math.pow(2, currentAttempt) * 1000; 
  return new Date(Date.now() + delayMs);
}

// Queue a webhook delivery
export async function queueWebhookDelivery(
  webhookId: string,
  transactionId: string,
  eventType: string,
  eventData: Record<string, unknown>
) {
  // Get the webhook configuration
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || !webhook.active) {
    console.log(`Webhook ${webhookId} is inactive or not found`);
    return null;
  }

  // Check if this event type is subscribed
  if (!webhook.events.includes(eventType)) {
    console.log(`Webhook ${webhookId} not subscribed to ${eventType}`);
    return null;
  }

  // Create delivery record
  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId,
      transactionId,
      eventType,
      payload: eventData as object,
      status: "pending",
      attempts: 0,
    },
  });

  // Add to queue (skip if Redis unavailable)
  const queue = getWebhookQueue();
  if (queue) {
    await queue.add(
      `delivery-${delivery.id}`,
      {
        deliveryId: delivery.id,
        webhookId: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        payload: eventData,
        attempt: 0,
      },
      {
        jobId: delivery.id, // Use delivery ID as job ID for deduplication
      }
    );
    console.log(`Queued webhook delivery ${delivery.id} for ${eventType}`);
  } else {
    console.warn(`Redis unavailable - webhook delivery ${delivery.id} not queued`);
  }

  return delivery;
}

// Dispatch webhooks for a successful transfer
export async function dispatchTransferWebhooks(
  transactionId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  fromBalance: number,
  toBalance: number
) {
  // Find all active webhooks that might be interested
  const webhooks = await prisma.webhook.findMany({
    where: {
      active: true,
      events: { hasSome: ["transfer.completed"] },
    },
  });

  const eventData = {
    event: "transfer.completed",
    timestamp: new Date().toISOString(),
    data: {
      transactionId,
      fromAccountId,
      toAccountId,
      amount,
      fromBalance,
      toBalance,
      currency: "INR",
    },
  };

  // Queue deliveries for all matching webhooks
  const deliveries = await Promise.all(
    webhooks.map((webhook) =>
      queueWebhookDelivery(
        webhook.id,
        transactionId,
        "transfer.completed",
        eventData
      )
    )
  );

  return deliveries.filter(Boolean);
}
