ALTER TABLE "attendances"
ADD COLUMN "monitoring_status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "monitoring_platform" TEXT,
ADD COLUMN "monitoring_started_at" TIMESTAMP(3);

CREATE TABLE "attendance_location_checks" (
    "id" TEXT NOT NULL,
    "attendance_id" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "captured_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "distance_meters" DOUBLE PRECISION,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_location_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_location_alerts" (
    "id" TEXT NOT NULL,
    "attendance_id" TEXT NOT NULL,
    "check_id" TEXT,
    "work_point_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "due_at" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3),
    "distance_meters" DOUBLE PRECISION,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "dedupe_key" TEXT NOT NULL,
    "review_outcome" TEXT,
    "review_note" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_location_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attendances_checked_out_at_monitoring_status_idx" ON "attendances"("checked_out_at", "monitoring_status");
CREATE UNIQUE INDEX "attendance_location_checks_attendance_id_due_at_key" ON "attendance_location_checks"("attendance_id", "due_at");
CREATE INDEX "attendance_location_checks_status_due_at_idx" ON "attendance_location_checks"("status", "due_at");
CREATE UNIQUE INDEX "attendance_location_alerts_dedupe_key_key" ON "attendance_location_alerts"("dedupe_key");
CREATE INDEX "attendance_location_alerts_work_point_id_status_created_at_idx" ON "attendance_location_alerts"("work_point_id", "status", "created_at");
CREATE INDEX "attendance_location_alerts_worker_id_created_at_idx" ON "attendance_location_alerts"("worker_id", "created_at");
CREATE INDEX "attendance_location_alerts_attendance_id_idx" ON "attendance_location_alerts"("attendance_id");
CREATE INDEX "attendance_location_alerts_type_idx" ON "attendance_location_alerts"("type");

ALTER TABLE "attendance_location_checks" ADD CONSTRAINT "attendance_location_checks_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_location_alerts" ADD CONSTRAINT "attendance_location_alerts_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_location_alerts" ADD CONSTRAINT "attendance_location_alerts_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "attendance_location_checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance_location_alerts" ADD CONSTRAINT "attendance_location_alerts_work_point_id_fkey" FOREIGN KEY ("work_point_id") REFERENCES "WorkPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_location_alerts" ADD CONSTRAINT "attendance_location_alerts_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_location_alerts" ADD CONSTRAINT "attendance_location_alerts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
