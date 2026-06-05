-- CreateEnum
CREATE TYPE "CompanySubcontractorAccessStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateTable
CREATE TABLE "company_subcontractor_access" (
    "id" TEXT NOT NULL,
    "owner_company_id" TEXT NOT NULL,
    "subcontractor_company_id" TEXT NOT NULL,
    "status" "CompanySubcontractorAccessStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "invited_admin_email" TEXT NOT NULL,
    "invited_by_id" TEXT,
    "accepted_by_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_subcontractor_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_subcontractor_access_token_key" ON "company_subcontractor_access"("token");

-- CreateIndex
CREATE UNIQUE INDEX "company_subcontractor_access_owner_company_id_subcontractor_company_id_key" ON "company_subcontractor_access"("owner_company_id", "subcontractor_company_id");

-- CreateIndex
CREATE INDEX "company_subcontractor_access_owner_company_id_idx" ON "company_subcontractor_access"("owner_company_id");

-- CreateIndex
CREATE INDEX "company_subcontractor_access_subcontractor_company_id_idx" ON "company_subcontractor_access"("subcontractor_company_id");

-- CreateIndex
CREATE INDEX "company_subcontractor_access_status_idx" ON "company_subcontractor_access"("status");

-- CreateIndex
CREATE INDEX "company_subcontractor_access_expires_at_idx" ON "company_subcontractor_access"("expires_at");

-- AddForeignKey
ALTER TABLE "company_subcontractor_access" ADD CONSTRAINT "company_subcontractor_access_owner_company_id_fkey" FOREIGN KEY ("owner_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subcontractor_access" ADD CONSTRAINT "company_subcontractor_access_subcontractor_company_id_fkey" FOREIGN KEY ("subcontractor_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subcontractor_access" ADD CONSTRAINT "company_subcontractor_access_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subcontractor_access" ADD CONSTRAINT "company_subcontractor_access_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
