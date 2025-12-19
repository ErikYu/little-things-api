-- CreateEnum
CREATE TYPE "public"."APNHistoryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "public"."apn_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_token" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "topic" TEXT,
    "status" "public"."APNHistoryStatus" NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apn_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."apn_histories" ADD CONSTRAINT "apn_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
