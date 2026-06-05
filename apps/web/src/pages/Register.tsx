import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowRight, Building2, KeyRound, Mail, UserRound } from "lucide-react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "../hooks/useAuth";
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
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (confirmPassword.length === 0) {
      setError(t("Repeat password is required."));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("Passwords do not match."));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isPaidSignupMode) {
        const { url } = await billingAPI.createCompanySignupCheckout({
          username: trimmedUsername,
          email: trimmedEmail,
          password,
          confirmPassword,
          companyName: trimmedCompanyName,
        });
        window.location.href = url;
        return;
      }

      await api.post<RegisterResponse>("/auth/register", {
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        confirmPassword,
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

  const registerTitle = isPaidSignupMode
    ? t("Create your company workspace")
    : isBootstrapMode
      ? t("Create the first company administrator")
      : t("Create your account");
  const registerSubtitle = isPaidSignupMode
    ? t("Your subscription starts at €3 per active user each month after checkout.")
    : isBootstrapMode
      ? t("Bootstrap registration only works when it is enabled on the API and no company exists yet.")
      : t("Join the Construction ERP system");

  return (
    <AuthShell
      modeLabel={token ? t("Register") : registerTitle}
      title={registerTitle}
      subtitle={registerSubtitle}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{t("Already have an account?")}</span>
          <RouterLink
            to="/login"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            {t("Sign in")}
            <ArrowRight className="h-3.5 w-3.5" />
          </RouterLink>
        </div>
      }
    >
      <div className="space-y-5">
        {token && (
          <Alert>
            {t("You're accepting an invitation. Your role will be assigned automatically.")}
          </Alert>
        )}
        {isPaidSignupMode && (
          <Alert>
            {t("Your subscription starts at €3 per active user each month after checkout.")}
          </Alert>
        )}
        {isBootstrapMode && (
          <Alert>
            {t("Bootstrap registration only works when it is enabled on the API and no company exists yet.")}
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="register-username">{t("Username")}</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-username"
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

          {(isBootstrapMode || isPaidSignupMode) && (
            <div className="space-y-1.5">
              <Label htmlFor="register-company">{t("Company name")}</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="organization"
                  placeholder={t("Your company")}
                  maxLength={120}
                  required
                  className="h-11 rounded-xl bg-background/80 pl-10 pr-3 shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="register-email">{t("Email address")}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-email"
                value={emailValue}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={t("you@example.com")}
                type="email"
                required
                disabled={Boolean(prefilledEmail)}
                className="h-11 rounded-xl bg-background/80 pl-10 pr-3 shadow-sm"
              />
            </div>
            {prefilledEmail && (
              <p className="text-xs text-muted-foreground">
                {t("Email is locked to the invited address.")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-password">{t("Password")}</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={6}
                required
                className="h-11 rounded-xl bg-background/80 pl-10 pr-3 shadow-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Must start with an uppercase letter and be at least 6 characters.")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-confirm-password">{t("Repeat password")}</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={6}
                required
                className="h-11 rounded-xl bg-background/80 pl-10 pr-3 shadow-sm"
              />
            </div>
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="h-11 w-full rounded-xl font-semibold shadow-sm"
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
    </AuthShell>
  );
}

function InviteOnlyRegistrationNotice() {
  const { t } = useI18n();
  return (
    <AuthShell
      modeLabel={t("Register")}
      title={t("Registration is invite-only")}
      subtitle={t(
        "New companies can start with paid signup. Invited users should use their invitation link.",
      )}
    >
      <div className="space-y-5">
        <Alert>
          {t(
            "For first-time setup on an empty database, use the bootstrap registration flow.",
          )}
        </Alert>
        <div className="grid gap-3">
          <Button asChild size="lg" className="h-11 rounded-xl font-semibold shadow-sm">
            <RouterLink to="/register?paid=1">
              {t("Start paid signup")}
            </RouterLink>
          </Button>
          <Button asChild variant="secondary" size="lg" className="h-11 rounded-xl font-semibold shadow-sm">
            <RouterLink to="/register?bootstrap=1">
              {t("Create first administrator")}
            </RouterLink>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 rounded-xl font-semibold">
            <RouterLink to="/login">{t("Login")}</RouterLink>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
