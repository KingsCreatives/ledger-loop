-- CreateEnum
CREATE TYPE "EntrySource" AS ENUM ('MANUAL', 'IMPORT');

-- AlterTable
ALTER TABLE "ImportBatch" ALTER COLUMN "contentHash" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ImportRow" ADD COLUMN     "matchLineId" TEXT;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "source" "EntrySource" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "TransactionLine" ADD COLUMN     "isReconciled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reconciledAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_matchLineId_fkey" FOREIGN KEY ("matchLineId") REFERENCES "TransactionLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
