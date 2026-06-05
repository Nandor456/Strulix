import { useState } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";
import { useAcceptSubcontractorInvitation } from "@/hooks/useSubcontractors";
import type { SubcontractorAccess } from "@/services/api/subcontractorApi";

export default function SubcontractorAcceptPage() {
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const acceptMutation = useAcceptSubcontractorInvitation();
  const [accepted, setAccepted] = useState<SubcontractorAccess | null>(null);
  const token = searchParams.get("token") ?? "";

  async function accept() {
    if (!token) return;
    const result = await acceptMutation.mutateAsync(token);
    setAccepted(result);
  }

  const error =
    (acceptMutation.error as { response?: { data?: { error?: string } } } | null)
      ?.response?.data?.error ?? null;

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-8">
      <div className="w-full rounded-lg border p-6">
        <div className="mb-5 flex items-center gap-3">
          {accepted ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          ) : (
            <Building2 className="h-8 w-8 text-primary" />
          )}
          <div>
            <h1 className="text-2xl font-semibold">
              {t("Subcontractor invitation")}
            </h1>
            {accepted && (
              <p className="text-sm text-muted-foreground">
                {accepted.ownerCompany.name}
              </p>
            )}
          </div>
        </div>

        {!token && (
          <Alert variant="destructive">{t("Invitation link is invalid.")}</Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        {accepted ? (
          <div className="space-y-4">
            <Alert>
              {t("Subcontractor invitation accepted.")}
            </Alert>
            <Button asChild>
              <Link to="/invitations">{t("Back to invitations")}</Link>
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => void accept()}
            disabled={!token || acceptMutation.isPending}
          >
            {acceptMutation.isPending && <Spinner size={16} />}
            {acceptMutation.isPending
              ? t("Accepting…")
              : t("Accept invitation")}
          </Button>
        )}
      </div>
    </div>
  );
}
