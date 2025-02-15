/*
  Warnings:

  - You are about to alter the column `discount_total` on the `Discount` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Discount" ALTER COLUMN "discount_total" DROP DEFAULT,
ALTER COLUMN "discount_total" SET DATA TYPE INTEGER;
