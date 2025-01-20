/*
  Warnings:

  - Added the required column `valid_until` to the `Discount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Discount" ADD COLUMN     "valid_until" TIMESTAMP(3) NOT NULL;
