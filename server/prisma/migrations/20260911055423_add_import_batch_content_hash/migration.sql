/*
  Warnings:

  - A unique constraint covering the columns `[accountId,contentHash]` on the table `ImportBatch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ImportBatch" ADD COLUMN     "contentHash" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_accountId_contentHash_key" ON "ImportBatch"("accountId", "contentHash");
