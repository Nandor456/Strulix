import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";
import { translateApiErrorMessage } from "@/lib/apiErrors";
import { api } from "@/services/api/axios";
import { resetUserScopedQueries } from "../services/queryClient";
import buildPulseLogo from "@/assets/buildpulselogo.png";
type LoginResponse =
  | { id: string; username: string }
  | { error?: string; errors?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> } };

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { t } = useI18n();

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <img
            src={buildPulseLogo}
            alt={t("BuildPulse logo")}
            className="h-24 w-24"
          />
          <h1 className="text-center text-xl font-bold">{t("Sign in")}</h1>
          <p className="text-center text-sm text-muted-foreground">
            {t("Welcome back to BuildPulse")}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-username">{t("Username")}</Label>
              <Input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={t("your.username")}
                minLength={3}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password">{t("Password")}</Label>
              <Input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 font-semibold"
            >
              {isSubmitting && <Spinner className="mr-2" />}
              {isSubmitting ? t("Signing in…") : t("Sign in")}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("No account?")}{" "}
          <RouterLink
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            {t("Register")}
          </RouterLink>
        </p>
      </div>
    </main>
  );
}
