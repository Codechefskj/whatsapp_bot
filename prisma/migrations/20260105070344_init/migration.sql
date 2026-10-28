
-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'AWAITING_FEEDBACK',
    'REJECTED'
);

-- AlterTable
ALTER TABLE "WhatsAppMessage"
ADD COLUMN "direction" "MessageDirection" NOT NULL DEFAULT 'IN',
ADD COLUMN "to" TEXT;

-- CreateTable
CREATE TABLE "Design" (
    "id" SERIAL NOT NULL,
    "to" TEXT NOT NULL,
    "mediaId" TEXT,
    "status" "DesignStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Design_to_status_idx"
ON "Design"("to", "status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_from_idx"
ON "WhatsAppMessage"("from");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_to_idx"
ON "WhatsAppMessage"("to");
