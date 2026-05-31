import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PublicHeader } from "@/components/public-header";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { translateApiErrorMessage } from "@/lib/apiErrors";
import { billingAPI } from "@/services/api/billingApi";

type SignupCompleteError = {
  error?: string;
  errors?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

export default function SignupSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id") ?? "";

  useEffect(() => {
    let isMounted = true;

    async function completeSignup() {
      if (!sessionId) {
        setError(t("Checkout session is required."));
        return;
      }

      try {
        await billingAPI.completeCompanySignup(sessionId);
        await refreshUser();
        if (isMounted) navigate("/", { replace: true });
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof AxiosError) {
          setError(
            translateApiErrorMessage(
              error.response?.data as SignupCompleteError | undefined,
              t("Failed to complete paid registration"),
              t,
            ),
          );
          return;
        }
        setError(t("Network error. Please try again."));
      }
    }

    void completeSignup();

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshUser, sessionId, t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-md border bg-card p-6 text-center shadow-sm sm:p-8">
          {!error ? (
            <>
              <Spinner size={36} className="mx-auto" />
              <h1 className="mt-5 text-2xl font-semibold">
                {t("Completing your signup")}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("We are confirming your subscription and preparing your admin account.")}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">
                {t("We could not complete signup")}
              </h1>
              <Alert variant="destructive" className="mt-5 text-left">
                {error}
              </Alert>
              <Button asChild className="mt-6">
                <Link to="/register?paid=1">{t("Try again")}</Link>
              </Button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
