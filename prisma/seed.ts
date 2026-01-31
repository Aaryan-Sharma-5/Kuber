import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create demo accounts
  const account1 = await prisma.account.upsert({
    where: { id: "acc-alice-001" },
    update: {},
    create: {
      id: "acc-alice-001",
      userId: "user_alice",
      name: "Alice's Wallet",
      balance: 10000.0,
      currency: "INR",
    },
  });

  const account2 = await prisma.account.upsert({
    where: { id: "acc-bob-002" },
    update: {},
    create: {
      id: "acc-bob-002",
      userId: "user_bob",
      name: "Bob's Wallet",
      balance: 5000.0,
      currency: "INR",
    },
  });

  const account3 = await prisma.account.upsert({
    where: { id: "acc-charlie-003" },
    update: {},
    create: {
      id: "acc-charlie-003",
      userId: "user_charlie",
      name: "Charlie's Savings",
      balance: 15000.0,
      currency: "INR",
    },
  });

  console.log("Created accounts:");
  console.log(`- ${account1.name}: ₹${account1.balance}`);
  console.log(`- ${account2.name}: ₹${account2.balance}`);
  console.log(`- ${account3.name}: ₹${account3.balance}`);

  console.log("\n Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
