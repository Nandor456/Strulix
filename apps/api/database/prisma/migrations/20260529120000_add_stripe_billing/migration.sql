-- AlterTable
ALTER TABLE "companies" ADD COLUMN "payment_subscription_item_id" TEXT;
ALTER TABLE "companies" ADD COLUMN "payment_seat_quantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "pending_paid_registrations" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "stripe_checkout_session_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "company_id" TEXT,
    "user_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_paid_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_payment_subscription_item_id_key" ON "companies"("payment_subscription_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "pending_paid_registrations_stripe_checkout_session_id_key" ON "pending_paid_registrations"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "pending_paid_registrations_email_idx" ON "pending_paid_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_paid_registrations_username_idx" ON "pending_paid_registrations"("username");

-- CreateIndex
CREATE INDEX "pending_paid_registrations_expires_at_idx" ON "pending_paid_registrations"("expires_at");

-- AddForeignKey
ALTER TABLE "pending_paid_registrations" ADD CONSTRAINT "pending_paid_registrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
