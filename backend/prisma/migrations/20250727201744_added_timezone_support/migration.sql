-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processedBy" TEXT,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "timezone" TEXT DEFAULT 'UTC';

-- CreateIndex
CREATE INDEX "expenses_timezone_idx" ON "expenses"("timezone");

-- CreateIndex
CREATE INDEX "expenses_date_timezone_idx" ON "expenses"("date", "timezone");

-- CreateIndex
CREATE INDEX "expenses_processedAt_idx" ON "expenses"("processedAt");

-- CreateIndex
CREATE INDEX "expenses_processedBy_idx" ON "expenses"("processedBy");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
