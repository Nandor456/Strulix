ALTER TABLE "attendances" ADD COLUMN "checkout_source" TEXT;

UPDATE "attendances"
SET "checkout_source" = CASE
  WHEN "source" = 'MANUAL' THEN 'MANUAL'
  ELSE 'QR'
END
WHERE "checked_out_at" IS NOT NULL;
