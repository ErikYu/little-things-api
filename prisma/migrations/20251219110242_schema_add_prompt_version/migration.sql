/*
  Warnings:

  - A unique constraint covering the columns `[current_version_id]` on the table `prompts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."prompts" ADD COLUMN     "current_version_id" TEXT;

-- CreateTable
CREATE TABLE "public"."prompt_versions" (
    "id" TEXT NOT NULL,
    "prompt_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_note" TEXT,

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompt_versions_prompt_id_idx" ON "public"."prompt_versions"("prompt_id");

-- CreateIndex
CREATE INDEX "prompt_versions_prompt_id_version_idx" ON "public"."prompt_versions"("prompt_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_prompt_id_version_key" ON "public"."prompt_versions"("prompt_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "prompts_current_version_id_key" ON "public"."prompts"("current_version_id");

-- AddForeignKey
ALTER TABLE "public"."prompts" ADD CONSTRAINT "prompts_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
