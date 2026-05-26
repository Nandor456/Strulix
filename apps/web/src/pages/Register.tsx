import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";
import { api } from "@/services/api/axios";
import { resetUserScopedQueries } from "../services/queryClient";

type ValidationErrorPayload = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

type RegisterResponse =
  | { id: string; username: string }
  | { error?: string; errors?: ValidationErrorPayload };

const getErrorMessageFromResponse = (
  data: RegisterResponse,
  fallback: string
) => {
  if ("id" in data) {
    return fallback;
  }

  const firstFieldError = Object.values(data.errors?.fieldErrors ?? {})
    .flat()
    .find((message): message is string => Boolean(message));

  return data.error ?? data.errors?.formErrors?.[0] ?? firstFieldError ?? fallback;
};

const PASSWORD_PATTERN = /^[A-Z].{5,}$/;

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { t } = useI18n();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const prefilledEmail = searchParams.get("email") ?? "";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasValidPassword = PASSWORD_PATTERN.test(password);
  const emailValue = prefilledEmail || email;

  const canSubmit = useMemo(() => {
    return (
      username.trim().length >= 3 &&
      emailValue.trim().length > 0 &&
      hasValidPassword &&
      !isSubmitting
    );
  }, [username, emailValue, hasValidPassword, isSubmitting]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedEmail = emailValue.trim();
    if (trimmedUsername.length < 3) {
      setError(t("Username must be at least 3 characters."));
      return;
    }

    if (!trimmedEmail) {
      setError(t("Email is required."));
      return;
    }

    if (!hasValidPassword) {
      setError(
        t("Password must start with an uppercase letter and be at least 6 characters."),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post<RegisterResponse>("/auth/register", {
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        ...(token ? { token } : {}),
      });

      await resetUserScopedQueries(queryClient);
      await refreshUser();
      navigate("/", { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as RegisterResponse | undefined;
        if (data) {
          setError(getErrorMessageFromResponse(data, t("Registration failed")));
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
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <img
              src="/buildpulselogo.png"
              alt="BuildPulse logo"
              className="h-6 w-auto"
            />
          </div>
          <h1 className="text-center text-xl font-bold">{t("Create your account")}</h1>
          <p className="text-center text-sm text-muted-foreground">
            {t("Join the Construction ERP system")}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          {token && (
            <Alert className="mb-5">
              {t("You're accepting an invitation. Your role will be assigned automatically.")}
            </Alert>
          )}
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-username">{t("Username")}</Label>
              <Input
                id="register-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="your.username"
                minLength={3}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-email">{t("Email address")}</Label>
              <Input
                id="register-email"
                value={emailValue}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                type="email"
                required
                disabled={Boolean(prefilledEmail)}
              />
              {prefilledEmail && (
                <p className="text-xs text-muted-foreground">
                  {t("Email is locked to the invited address.")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-password">{t("Password")}</Label>
              <Input
                id="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("Must start with an uppercase letter and be at least 6 characters.")}
              </p>
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 font-semibold"
            >
              {isSubmitting && <Spinner className="mr-2" />}
              {isSubmitting ? t("Creating account…") : t("Create account")}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("Already have an account?")}{" "}
          <RouterLink
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            {t("Sign in")}
          </RouterLink>
        </p>
      </div>
    </main>
  );
}
