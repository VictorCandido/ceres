-- CreateTable
CREATE TABLE "Envelope" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Envelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvelopeLimit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "envelopeId" UUID NOT NULL,
    "limitCents" INTEGER NOT NULL,
    "effectiveFromMonth" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EnvelopeLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "envelopeId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMPTZ NOT NULL,
    "referenceMonth" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnvelopeLimit_envelopeId_effectiveFromMonth_key" ON "EnvelopeLimit"("envelopeId", "effectiveFromMonth");

-- CreateIndex
CREATE INDEX "Expense_envelopeId_referenceMonth_idx" ON "Expense"("envelopeId", "referenceMonth");

-- AddForeignKey
ALTER TABLE "EnvelopeLimit" ADD CONSTRAINT "EnvelopeLimit_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
