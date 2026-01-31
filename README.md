# Kuber - High-Reliability Payment Ledger

A full-stack Next.js application implementing a **double-entry accounting ledger** with idempotency, concurrency control, and auditability for financial transactions.

## 🌟 Features

- **Double-Entry Bookkeeping**: Every transfer creates immutable debit/credit ledger entries
- **Idempotency**: Exactly-once execution using unique idempotency keys
- **Concurrency Control**: PostgreSQL row-level locking prevents race conditions
- **ACID Transactions**: Full transaction support with serializable isolation
- **Event-Driven Webhooks**: Reliable webhook delivery via BullMQ with exponential backoff and retry logic
- **Chaos Mode Testing**: Built-in stress test to demonstrate idempotency and concurrency

## 🛠 Tech Stack

- **Framework**: Next.js 16+ (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 7
- **Queue**: BullMQ + Redis (for webhook delivery)
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **UI**: Glassmorphism design, React Flow (graph visualization)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud - Supabase recommended)
- Redis 6+ (for webhook queue processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Aaryan-Sharma-5/Kuber.git
   cd kuber
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your database and Redis:
   
   Create a `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/kuber?schema=public"
   DIRECT_URL="postgresql://user:password@host:5432/kuber"  # For migrations
   REDIS_URL="redis://localhost:6379"
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. (Optional) Seed demo accounts:
   ```bash
   npx prisma db seed
   ```

6. In one terminal, start the development server:
   ```bash
   npm run dev
   ```

7. (Optional) In another terminal, start the webhook worker:
   ```bash
   npx tsx lib/webhooks/worker.ts
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Account
- `id`: Unique identifier (UUID)
- `userId`: Owner user ID
- `name`: Account name
- `balance`: Current balance (Decimal)
- `currency`: Currency code (default: INR)

### LedgerEntry
- `id`: Unique identifier
- `transactionId`: Groups related debit/credit entries
- `accountId`: Associated account
- `amount`: Negative for debit, positive for credit

### IdempotencyKey
- `key`: Unique request identifier
- `responseCode`: Cached response status
- `responseBody`: Cached response data
- `completed`: Processing status

## 🔒 Core Engineering Principles

### Double-Entry Rule
$$\sum \text{Credits} + \sum \text{Debits} = 0$$

### Idempotency Flow
1. Check IdempotencyKey table
2. If found & complete → Return cached response
3. If found & locked → Return 409 Conflict
4. If not found → Create lock and process

### Concurrency Control
- Sort account IDs to prevent deadlocks
- Use `SELECT ... FOR UPDATE` for row-level locking
- Serializable transaction isolation level

## 🧪 Testing Idempotency

Use the **Chaos Mode** button to fire 10 simultaneous API requests with the same idempotency key. You'll see:
- ✅ 1 request succeeds (actual transfer)
- 🔄 Some return cached responses
- ⚠️ Some return 409 Conflict

## 📁 Project Structure

```
kuber/
├── app/
│   ├── api/
│   │   ├── accounts/             # Account management
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # GET single, balance
│   │   ├── transfer/             # Core transfer logic
│   │   │   └── route.ts          # POST transfer (idempotent)
│   │   └── webhooks/             # Webhook configuration
│   │       └── route.ts          # Manage webhooks
│   ├── globals.css               # Custom styles & animations
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main dashboard
│   └── graph/                    # Transaction graph view
│       └── page.tsx
├── components/
│   ├── AccountCard.tsx           # Account display
│   ├── ChaosModeButton.tsx       # Stress test UI
│   ├── CreateAccountModal.tsx    # Account creation
│   ├── TransactionGraph.tsx      # React Flow graph
│   ├── TransactionList.tsx       # Transaction history
│   └── TransferForm.tsx          # Transfer UI
├── lib/
│   ├── ledger.ts                 # Core transfer logic, idempotency
│   ├── prisma.ts                 # Prisma client singleton
│   ├── redis.ts                  # Redis connection
│   ├── validations.ts            # Zod schemas
│   └── webhooks/
│       ├── queue.ts              # BullMQ queue & worker
│       └── worker.ts             # Webhook worker process
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Demo data
├── public/
│   └── favicon.svg               # App icon
└── kuber-sdk/                    # TypeScript SDK (NPM)
    ├── src/
    │   └── index.ts              # SDK implementation
    └── package.json
```

## 🔔 Webhook Delivery System

Kuber supports event-driven webhooks for real-time integrations. Webhooks are delivered reliably using BullMQ (job queue) and Redis with exponential backoff and retry logic.

### Architecture
- **Event Trigger**: When a transfer completes, a webhook job is enqueued.
- **Job Queue**: BullMQ stores jobs in Redis with metadata (attempts, retry schedule).
- **Worker Process**: A separate Node.js process picks up jobs and delivers them.
- **Tracking**: Database stores delivery history, status, and response data.
- **Reliability**: Failed deliveries are retried up to 5 times with exponential backoff (1s → 2s → 4s → 8s → 16s).

### Setup

1. **Start Redis** (locally or use a managed service):
   ```bash
   redis-server  # or use Docker, Upstash, etc.
   ```

2. **Configure in `.env`**:
   ```env
   REDIS_URL="redis://localhost:6379"
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   REDIS_PASSWORD=""  # if required
   ```

3. **Configure webhooks** in your database:
   ```sql
   INSERT INTO "Webhook" (id, userId, url, secret, events, active, "createdAt", "updatedAt")
   VALUES (
     'webhook-1',
     '<your-user-id>',
     'https://your-api.com/webhooks/transfers',
     'your-secret-key',
     ARRAY['transfer.completed'],
     true,
     NOW(),
     NOW()
   );
   ```

4. **Start the worker**:
   ```bash
   npx tsx lib/webhooks/worker.ts
   ```

### Testing

1. Get a test URL from [webhook.site](https://webhook.site)
2. Insert a webhook record pointing to your test URL
3. Perform a transfer in the app
4. Check your worker logs for delivery status:
   ```
   📤 Webhook delivery attempt 1 for <id>
   ✅ Webhook delivered successfully: <id>
   ```
5. Verify the POST request arrived at webhook.site

### Webhook Payload

```json
{
  "event": "transfer.completed",
  "timestamp": "2026-02-15T10:30:00.000Z",
  "data": {
    "transactionId": "txn-123",
    "fromAccountId": "acc-456",
    "toAccountId": "acc-789",
    "amount": 1000,
    "fromBalance": 5000,
    "toBalance": 6000,
    "currency": "INR"
  }
}
```

### Webhook Headers

Each webhook request includes:
- `X-Kuber-Signature`: HMAC-SHA256 signature (verify with your secret)
- `X-Kuber-Timestamp`: Request timestamp (milliseconds)
- `X-Kuber-Delivery-Id`: Unique delivery ID (for idempotency)
- `Content-Type`: `application/json`
