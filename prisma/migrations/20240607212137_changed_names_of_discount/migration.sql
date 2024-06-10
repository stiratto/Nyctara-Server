/*
  Warnings:

  - You are about to drop the column `name` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `totalDiscount` on the `Discount` table. All the data in the column will be lost.
  - Added the required column `discount_name` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_total` to the `Discount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Discount" DROP COLUMN "name",
DROP COLUMN "totalDiscount",
ADD COLUMN     "discount_name" TEXT NOT NULL,
ADD COLUMN     "discount_total" TEXT NOT NULL;
