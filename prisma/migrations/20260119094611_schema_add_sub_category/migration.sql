-- AlterTable
ALTER TABLE "public"."questions" ADD COLUMN     "sub_category_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
