/*
  Warnings:

  - You are about to drop the column `pgn` on the `Theory` table. All the data in the column will be lost.
  - Added the required column `move` to the `Theory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Theory" DROP COLUMN "pgn",
ADD COLUMN     "move" TEXT NOT NULL;
