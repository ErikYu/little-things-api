/*
  Warnings:

  - A unique constraint covering the columns `[parent_id,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "parent_id" TEXT;

-- AlterTable
ALTER TABLE "public"."questions" ADD COLUMN     "cluster" TEXT;

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "public"."categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_parent_id_name_key" ON "public"."categories"("parent_id", "name");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
