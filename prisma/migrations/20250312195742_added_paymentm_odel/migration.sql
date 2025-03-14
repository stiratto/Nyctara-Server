-- CreateTable
CREATE TABLE "Payments" (
    "payment_id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Payments_payment_id_key" ON "Payments"("payment_id");
