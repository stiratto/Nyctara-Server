/*
  Warnings:

  - You are about to drop the column `image` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `product_quality` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Product` table. All the data in the column will be lost.
  - Added the required column `category_image` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_description` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "image",
ADD COLUMN     "category_image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "description",
DROP COLUMN "images",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "price",
DROP COLUMN "product_quality",
DROP COLUMN "tags",
ADD COLUMN     "product_description" TEXT NOT NULL,
ADD COLUMN     "product_images" TEXT[],
ADD COLUMN     "product_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "product_notes" TEXT[],
ADD COLUMN     "product_price" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "product_product_quality" "PRODUCT_QUALITY" NOT NULL DEFAULT 'REACONDICIONADO',
ADD COLUMN     "product_tags" TEXT[];
