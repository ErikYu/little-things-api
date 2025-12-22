-- CreateEnum
CREATE TYPE "public"."PromptTestIconStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."prompt_test_icons" (
    "id" TEXT NOT NULL,
    "prompt_version_id" TEXT NOT NULL,
    "test_input" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "public"."PromptTestIconStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "error" TEXT,
    "created_by" TEXT,
    "test_note" TEXT,

    CONSTRAINT "prompt_test_icons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompt_test_icons_prompt_version_id_idx" ON "public"."prompt_test_icons"("prompt_version_id");

-- CreateIndex
CREATE INDEX "prompt_test_icons_prompt_version_id_status_idx" ON "public"."prompt_test_icons"("prompt_version_id", "status");

-- AddForeignKey
ALTER TABLE "public"."prompt_test_icons" ADD CONSTRAINT "prompt_test_icons_prompt_version_id_fkey" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
