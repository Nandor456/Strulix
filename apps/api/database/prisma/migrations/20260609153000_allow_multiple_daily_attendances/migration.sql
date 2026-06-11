DROP INDEX "attendances_worker_id_work_point_id_date_key";

CREATE INDEX "attendances_worker_id_work_point_id_checked_out_at_checked_in_a_idx"
ON "attendances"("worker_id", "work_point_id", "checked_out_at", "checked_in_at");
