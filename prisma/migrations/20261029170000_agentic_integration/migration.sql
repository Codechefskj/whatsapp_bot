-- Agentic image-workflow integration: idempotent previews, durable jobs, and
-- per-phone draft/clarification sessions.
ALTER TABLE "Design" ADD COLUMN "handoffKey" TEXT;
CREATE UNIQUE INDEX "Design_handoffKey_key" ON "Design"("handoffKey");

CREATE TYPE "IntegrationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'RETRY', 'COMPLETED', 'FAILED');

CREATE TABLE "IntegrationJob" (
  "id" SERIAL NOT NULL,
  "kind" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "IntegrationJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IntegrationJob_dedupeKey_key" ON "IntegrationJob"("dedupeKey");
CREATE INDEX "IntegrationJob_status_runAfter_idx" ON "IntegrationJob"("status", "runAfter");

CREATE TABLE "ConversationSession" (
  "id" SERIAL NOT NULL,
  "phone" TEXT NOT NULL,
  "productDraftId" TEXT,
  "pendingQuestionId" TEXT,
  "designJobId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'COLLECTING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConversationSession_phone_key" ON "ConversationSession"("phone");