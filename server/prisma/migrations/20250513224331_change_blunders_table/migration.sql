/*
  Warnings:

  - You are about to drop the column `created_at` on the `Blunders` table. All the data in the column will be lost.
  - Added the required column `loss` to the `Blunders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Blunders" DROP COLUMN "created_at",
ADD COLUMN     "loss" DOUBLE PRECISION NOT NULL;
