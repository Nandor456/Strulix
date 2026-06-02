import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PublicHeader } from "@/components/public-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";
import { translateApiErrorMessage } from "@/lib/apiErrors";
import { api } from "@/services/api/axios";
import { billingAPI } from "@/services/api/billingApi";
import { resetUserScopedQueries } from "../services/queryClient";
import buildPulseLogo from "@/assets/buildpulselogo.png";

type RegisterResponse =
  | { id: string; username: string }
  | { error?: string; errors?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> } };

const PASSWORD_PATTERN = /^[A-Z].{5,}$/;

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { t } = useI18n();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const prefilledEmail = searchParams.get("email") ?? "";
  const isBootstrapMode =
    searchParams.get("bootstrap") === "1" ||
    searchParams.get("bootstrap") === "true";
  const isPaidSignupMode =
    searchParams.get("paid") === "1" ||
    searchParams.get("paid") === "true";
  const showRegistrationForm = Boolean(token) || isBootstrapMode || isPaidSignupMode;

  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasValidPassword = PASSWORD_PATTERN.test(password);
  const emailValue = prefilledEmail || email;

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

    const trimmedCompanyName = companyName.trim();
    if ((isBootstrapMode || isPaidSignupMode) && !trimmedCompanyName) {
      setError(t("Company name is required."));
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
      if (isPaidSignupMode) {
        const { url } = await billingAPI.createCompanySignupCheckout({
          username: trimmedUsername,
          email: trimmedEmail,
          password,
          companyName: trimmedCompanyName,
        });
        window.location.href = url;
        return;
      }

      await api.post<RegisterResponse>("/auth/register", {
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        ...(isBootstrapMode ? { companyName: trimmedCompanyName } : {}),
        ...(token ? { token } : {}),
      });

      await resetUserScopedQueries(queryClient);
      await refreshUser();
      navigate("/", { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as RegisterResponse | undefined;
        if (data && !("id" in data)) {
          setError(
            translateApiErrorMessage(
              data,
              isPaidSignupMode
                ? t("Failed to start checkout")
                : t("Registration failed"),
              t,
            ),
          );
          return;
        }
      }

      setError(t("Network error. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!showRegistrationForm) {
    return <InviteOnlyRegistrationNotice />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <img
            src={buildPulseLogo}
            alt={t("Strulix logo")}
            className="h-24 w-24"
          />
          <h1 className="text-center text-xl font-bold">{t("Create your account")}</h1>
          <p className="text-center text-sm text-muted-foreground">
            {isPaidSignupMode
              ? t("Create your company workspace")
              : isBootstrapMode
                ? t("Create the first company administrator")
                : t("Join the Construction ERP system")}
          </p>
        </div>

        <div className="rounded-md border bg-card p-6 sm:p-8">
          {token && (
            <Alert className="mb-5">
              {t("You're accepting an invitation. Your role will be assigned automatically.")}
            </Alert>
          )}
          {isPaidSignupMode && (
            <Alert className="mb-5">
              {t("Your subscription starts at €3 per active user each month after checkout.")}
            </Alert>
          )}
          {isBootstrapMode && (
            <Alert className="mb-5">
              {t("Bootstrap registration only works when it is enabled on the API and no company exists yet.")}
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
                placeholder={t("your.username")}
                minLength={3}
                required
              />
            </div>

            {(isBootstrapMode || isPaidSignupMode) && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="register-company">{t("Company name")}</Label>
                <Input
                  id="register-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="organization"
                  placeholder={t("Your company")}
                  maxLength={120}
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="register-email">{t("Email address")}</Label>
              <Input
                id="register-email"
                value={emailValue}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={t("you@example.com")}
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
              disabled={isSubmitting}
              className="w-full py-2.5 font-semibold"
            >
              {isSubmitting && <Spinner className="mr-2" />}
              {isSubmitting
                ? isPaidSignupMode
                  ? t("Opening checkout…")
                  : t("Creating account…")
                : isPaidSignupMode
                  ? t("Continue to payment")
                  : t("Create account")}
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

function InviteOnlyRegistrationNotice() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-12">
        <section className="w-full max-w-lg rounded-md border bg-card p-6 text-center shadow-sm sm:p-8">
          <img
            src={buildPulseLogo}
            alt={t("Strulix logo")}
            className="mx-auto h-20 w-20 rounded-md"
          />
          <h1 className="mt-6 text-2xl font-semibold">
            {t("Registration is invite-only")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t(
              "New companies can start with paid signup. Invited users should use their invitation link.",
            )}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t(
              "For first-time setup on an empty database, use the bootstrap registration flow.",
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <RouterLink to="/register?paid=1">
                {t("Start paid signup")}
              </RouterLink>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <RouterLink to="/register?bootstrap=1">
                {t("Create first administrator")}
              </RouterLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <RouterLink to="/login">{t("Login")}</RouterLink>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
