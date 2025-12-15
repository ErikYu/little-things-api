-- CreateEnum
CREATE TYPE "public"."PromptCategory" AS ENUM ('ICON_GENERATION');

-- CreateTable
CREATE TABLE "public"."prompts" (
    "id" TEXT NOT NULL,
    "category" "public"."PromptCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);
