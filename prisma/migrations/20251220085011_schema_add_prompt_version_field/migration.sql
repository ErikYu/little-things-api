-- AlterTable
ALTER TABLE "public"."answer_icons" ADD COLUMN     "prompt_version_id" TEXT;

-- CreateIndex
CREATE INDEX "answer_icons_prompt_version_id_idx" ON "public"."answer_icons"("prompt_version_id");

-- AddForeignKey
ALTER TABLE "public"."answer_icons" ADD CONSTRAINT "answer_icons_prompt_version_id_fkey" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
