-- CreateTable
CREATE TABLE "public"."question_of_the_day" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_of_the_day_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_of_the_day_sequence_idx" ON "public"."question_of_the_day"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "question_of_the_day_question_id_key" ON "public"."question_of_the_day"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_of_the_day_sequence_key" ON "public"."question_of_the_day"("sequence");

-- AddForeignKey
ALTER TABLE "public"."question_of_the_day" ADD CONSTRAINT "question_of_the_day_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
