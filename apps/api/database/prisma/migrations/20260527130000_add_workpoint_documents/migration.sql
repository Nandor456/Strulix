-- CreateTable
CREATE TABLE "workpoint_documents" (
    "id" TEXT NOT NULL,
    "work_point_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workpoint_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workpoint_documents_stored_name_key" ON "workpoint_documents"("stored_name");

-- CreateIndex
CREATE INDEX "workpoint_documents_work_point_id_created_at_idx" ON "workpoint_documents"("work_point_id", "created_at");

-- CreateIndex
CREATE INDEX "workpoint_documents_uploaded_by_id_idx" ON "workpoint_documents"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "workpoint_documents" ADD CONSTRAINT "workpoint_documents_work_point_id_fkey" FOREIGN KEY ("work_point_id") REFERENCES "WorkPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workpoint_documents" ADD CONSTRAINT "workpoint_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
