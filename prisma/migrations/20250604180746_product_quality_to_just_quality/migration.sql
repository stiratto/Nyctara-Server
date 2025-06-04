/*
  Warnings:

  - You are about to drop the column `product_quality` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "product_quality",
ADD COLUMN     "quality" "PRODUCT_QUALITY" NOT NULL DEFAULT 'REACONDICIONADO';
