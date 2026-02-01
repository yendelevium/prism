/*
  Warnings:

  - You are about to drop the column `executionId` on the `Span` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `Span` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Span" DROP CONSTRAINT "Span_executionId_fkey";

-- DropForeignKey
ALTER TABLE "Span" DROP CONSTRAINT "Span_requestId_fkey";

-- AlterTable
ALTER TABLE "Span" DROP COLUMN "executionId",
DROP COLUMN "requestId";
