import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowRight, KeyRound, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";
import { getPublicRegistrationHref } from "@/lib/registration";
import { translateApiErrorMessage } from "@/lib/apiErrors";
import { api } from "@/services/api/axios";
import { resetUserScopedQueries } from "../services/queryClient";

type LoginResponse =
  | { id: string; username: string }
  | { error?: string; errors?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> } };

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { t } = useI18n();
  const registrationHref = getPublicRegistrationHref();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return username.trim().length >= 3 && password.length > 0 && !isSubmitting;
  }, [username, password, isSubmitting]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || password.length === 0) {
      setError(t("Please enter a username and password."));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post<LoginResponse>("/auth/login", {
        username: trimmedUsername,
        password,
      });

      await resetUserScopedQueries(queryClient);
      await refreshUser();
      const redirect = searchParams.get("redirect");
      const destination = redirect && redirect.startsWith("/") ? redirect : "/";
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as LoginResponse | undefined;
        if (data && !("id" in data)) {
          setError(translateApiErrorMessage(data, t("Login failed"), t));
          return;
        }
      }

      setError(t("Network error. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      modeLabel={t("Sign in")}
      title={t("Welcome back to Strulix")}
      subtitle={t(
        "Strulix keeps field work, office review, and worker self-service connected without adding another messy spreadsheet.",
      )}
      footer={
        <div className="flex items-center justify-end">
          <Link to={registrationHref} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            {t("Create account")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="login-username">{t("Username")}</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder={t("your.username")}
              minLength={3}
              required
              className="h-11 rounded-xl bg-background/80 pl-10 pr-3 shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password">{t("Password")}</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("Forgot password?")}
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="h-11 rounded-xl bg-background/80 pl-10 pr-3 shadow-sm"
            />
          </div>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}

        <Button
          type="submit"
          disabled={!canSubmit}
          size="lg"
          className="h-11 w-full rounded-xl font-semibold shadow-sm"
        >
          {isSubmitting && <Spinner className="mr-2" />}
          {isSubmitting ? t("Signing in…") : t("Sign in")}
        </Button>
      </form>
    </AuthShell>
  );
}
