/*
  Warnings:

  - Added the required column `loss` to the `theoreticalBlunders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "theoreticalBlunders" ADD COLUMN     "loss" DOUBLE PRECISION NOT NULL;
