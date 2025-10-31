import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  
  const sampleExpenses = [
    {
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      cid: "QmSample1",
      submissionHash: "0x1234...",
      txHash: "0xabc...",
      blockNumber: "12345",
      category: "food",
      note: "Sample food expense",
      status: "confirmed",
    },
    {
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      cid: "QmSample2",
      submissionHash: "0x5678...",
      txHash: "0xdef...",
      blockNumber: "12346",
      category: "transport",
      note: "Sample transport expense",
      status: "confirmed",
    },
  ];
  
  for (const expense of sampleExpenses) {
    await prisma.expense.upsert({
      where: { cid: expense.cid },
      create: expense,
      update: {},
    });
  }
  
  console.log("✅ Database seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

