import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import buildPulseLogo from "@/assets/buildpulselogo.png";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";
import { translateApiErrorFromUnknown } from "@/lib/apiErrors";
import { authAPI } from "@/services/api/authApi";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && !isSubmitting;
  }, [email, isSubmitting]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes("@")) {
      setError(t("Please enter a valid email address."));
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.requestPasswordReset(trimmedEmail);
      setSent(true);
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
            alt={t("BuildPulse logo")}
            className="h-24 w-24"
          />
          <h1 className="text-center text-xl font-bold">{t("Forgot password?")}</h1>
          <p className="text-center text-sm text-muted-foreground">
            {t("Enter your email and we will send a password reset link.")}
          </p>
        </div>

        <div className="rounded-md border bg-card p-6 sm:p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-email">{t("Email address")}</Label>
              <Input
                id="forgot-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder={t("you@example.com")}
                type="email"
                required
              />
            </div>

            {sent && (
              <Alert>
                {t("If an account exists, we sent a password reset link.")}
              </Alert>
            )}
            {error && <Alert variant="destructive">{error}</Alert>}

            <Button type="submit" disabled={!canSubmit} className="w-full">
              {isSubmitting ? <Spinner size={16} /> : <Mail className="h-4 w-4" />}
              {isSubmitting ? t("Sending…") : t("Send reset link")}
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
