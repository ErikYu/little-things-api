-- CreateEnum
CREATE TYPE "public"."AnswerIconStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."answer_icons" (
    "id" TEXT NOT NULL,
    "answer_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "public"."AnswerIconStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answer_icons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "answer_icons_answer_id_key" ON "public"."answer_icons"("answer_id");

-- AddForeignKey
ALTER TABLE "public"."answer_icons" ADD CONSTRAINT "answer_icons_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
