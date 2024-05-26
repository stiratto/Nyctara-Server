/*
  Warnings:

  - You are about to drop the column `productId` on the `Category` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Category_productId_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "productId";
