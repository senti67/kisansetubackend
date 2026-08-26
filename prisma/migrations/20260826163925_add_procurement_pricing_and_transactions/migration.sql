-- CreateEnum
CREATE TYPE "ProcurementDecision" AS ENUM ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProcurementPrice" (
    "id" SERIAL NOT NULL,
    "cropId" INTEGER NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementTransaction" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "verifiedBy" INTEGER,
    "decision" "ProcurementDecision" NOT NULL,
    "verifiedQuantity" DECIMAL(65,30) NOT NULL,
    "verifiedQuality" TEXT,
    "applicableRate" DECIMAL(65,30) NOT NULL,
    "finalPayableAmount" DECIMAL(65,30) NOT NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementTransaction_bookingId_key" ON "ProcurementTransaction"("bookingId");

-- AddForeignKey
ALTER TABLE "ProcurementPrice" ADD CONSTRAINT "ProcurementPrice_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementTransaction" ADD CONSTRAINT "ProcurementTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementTransaction" ADD CONSTRAINT "ProcurementTransaction_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
