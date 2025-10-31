-- CreateTable
CREATE TABLE "expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userAddress" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "submissionHash" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_cid_key" ON "expenses"("cid");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_submissionHash_key" ON "expenses"("submissionHash");

-- CreateIndex
CREATE INDEX "expenses_userAddress_idx" ON "expenses"("userAddress");

-- CreateIndex
CREATE INDEX "expenses_timestamp_idx" ON "expenses"("timestamp");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");
