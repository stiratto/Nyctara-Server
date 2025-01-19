-- CreateEnum
CREATE TYPE "PRODUCT_QUALITY" AS ENUM ('ORIGINAL', 'REACONDICIONADO');

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT[],
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "images" TEXT[],
    "tags" TEXT[],
    "categoryId" UUID NOT NULL,
    "product_quality" "PRODUCT_QUALITY" NOT NULL DEFAULT 'REACONDICIONADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "category_name" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" UUID NOT NULL,
    "discount_name" VARCHAR(255) NOT NULL,
    "discount_total" DECIMAL(65,30) NOT NULL DEFAULT 0.00,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_category_name_key" ON "Category"("category_name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
