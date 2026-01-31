/* Webhook Worker Process
 * Run this as a separate process to handle webhook deliveries: npx tsx lib/webhooks/worker.ts 
 */

import "dotenv/config";
import { createWebhookWorker } from "./queue";

console.log("Starting Webhook Worker...");

const worker = createWebhookWorker();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  await worker.close();
  process.exit(0);
});

console.log("Webhook Worker is running and waiting for jobs...");
