/*
  Warnings:

  - Added the required column `counter` to the `Blunders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isAnalyzed` to the `Games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Blunders" ADD COLUMN     "counter" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Games" ADD COLUMN     "isAnalyzed" BOOLEAN NOT NULL;
