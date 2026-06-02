import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";

import buildPulseLogo from "@/assets/buildpulselogo.png";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";
import { translateApiErrorFromUnknown } from "@/lib/apiErrors";
import { authAPI } from "@/services/api/authApi";

const PASSWORD_PATTERN = /^[A-Z].{5,}$/;

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const canSubmit = useMemo(() => {
    return token.length > 0 && PASSWORD_PATTERN.test(password) && !isSubmitting;
  }, [password, token, isSubmitting]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setComplete(false);

    if (!token) {
      setError(t("Password reset token is required."));
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      setError(
        t("Password must start with an uppercase letter and be at least 6 characters."),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.resetPassword({ token, password });
      setComplete(true);
      setPassword("");
    } catch (error) {
      setError(translateApiErrorFromUnknown(error, t("Password reset failed"), t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <img
            src={buildPulseLogo}
            alt={t("Strulix logo")}
            className="h-24 w-24"
          />
          <h1 className="text-center text-xl font-bold">{t("Reset password")}</h1>
          <p className="text-center text-sm text-muted-foreground">
            {t("Choose a new password for your Strulix account.")}
          </p>
        </div>

        <div className="rounded-md border bg-card p-6 sm:p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-password">{t("New password")}</Label>
              <Input
                id="reset-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={6}
                required
                disabled={!token || complete}
              />
              <p className="text-xs text-muted-foreground">
                {t("Must start with an uppercase letter and be at least 6 characters.")}
              </p>
            </div>

            {!token && (
              <Alert variant="destructive">
                {t("Password reset token is required.")}
              </Alert>
            )}
            {complete && (
              <Alert>
                {t("Your password has been updated. You can sign in with the new password.")}
              </Alert>
            )}
            {error && <Alert variant="destructive">{error}</Alert>}

            <Button type="submit" disabled={!canSubmit} className="w-full">
              {isSubmitting ? (
                <Spinner size={16} />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {isSubmitting ? t("Updating…") : t("Update password")}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("Back to sign in")}
          </Link>
        </p>
      </div>
    </main>
  );
}
