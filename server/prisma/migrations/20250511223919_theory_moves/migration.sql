/*
  Warnings:

  - You are about to drop the column `move` on the `Theory` table. All the data in the column will be lost.
  - Added the required column `move` to the `theoreticalBlunders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `move` to the `theoreticalContinuations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Theory" DROP COLUMN "move";

-- AlterTable
ALTER TABLE "theoreticalBlunders" ADD COLUMN     "move" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "theoreticalContinuations" ADD COLUMN     "move" TEXT NOT NULL;
