/*
  Warnings:

  - You are about to drop the column `promotionId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Promotion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_promotionId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "promotionId";

-- DropTable
DROP TABLE "Promotion";
