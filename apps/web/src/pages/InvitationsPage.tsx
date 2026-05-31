import { useMemo, useState, type FormEvent } from "react";


import { Copy, Mail, Send, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import { formatDateTime } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
} from "../hooks/useInvitations";
import { useAuth } from "@/hooks/useAuth";
import { isBillingActive, isBillingRequiredError } from "@/lib/billing";
import type {
  Invitation,
  InvitationRole,
  InvitationStatus,
} from "../services/api/invitationApi";

const ROLE_OPTIONS: InvitationRole[] = ["WORKER", "LEADER"];

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning";

const STATUS_VARIANTS: Record<InvitationStatus, BadgeVariant> = {
  pending: "secondary",
  accepted: "success",
  revoked: "outline",
  expired: "warning",
};

export default function InvitationsPage() {
  const { t, roleLabel, invitationStatusLabel } = useI18n();
  const { user } = useAuth();
  const { data: invitations = [], isLoading, error } = useInvitations();
  const createMutation = useCreateInvitation();
  const revokeMutation = useRevokeInvitation();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("WORKER");
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const hasActiveBilling = isBillingActive(user?.company.billingStatus);

  const roleOptions = useMemo(
    () => ROLE_OPTIONS.map((value) => ({ value, label: roleLabel(value) })),
    [roleLabel],
  );

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && hasActiveBilling && !createMutation.isPending;
  }, [email, hasActiveBilling, createMutation.isPending]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError(t("Email is required."));
      return;
    }

    try {
      await createMutation.mutateAsync({ email: trimmedEmail, role });
      setEmail("");
      setRole("WORKER");
    } catch (err: unknown) {
      if (isBillingRequiredError(err)) {
        setFormError(t("Billing is required to continue."));
        return;
      }

      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? t("Failed to send invitation");
      setFormError(message);
    }
  }

  async function handleCopyLink(invitation: Invitation) {
    try {
      await navigator.clipboard.writeText(invitation.inviteUrl);
      setCopiedId(invitation.id);
      setTimeout(() => {
        setCopiedId((current) => (current === invitation.id ? null : current));
      }, 1500);
    } catch {
      // Clipboard unavailable — ignore silently.
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">{t("User Invitations")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Invite new users by email. Each invitation carries a role and a one-time registration link.",
            )}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-lg border p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("Invite a new user")}</h2>
        {!hasActiveBilling && (
          <Alert variant="destructive" className="mb-4">
            {t("Your subscription is not active. Fix billing before inviting users.")}
          </Alert>
        )}
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="invite-email">{t("Email address")}</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("user@example.com")}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
              <Label htmlFor="invite-role">{t("Role")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as InvitationRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="sm:min-w-[160px]"
            >
              {createMutation.isPending ? (
                <Spinner size={16} />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {createMutation.isPending ? t("Sending…") : t("Send invitation")}
            </Button>
          </div>
          {formError && (
            <Alert variant="destructive" className="mt-3">
              {formError}
            </Alert>
          )}
        </form>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={36} />
        </div>
      )}

      {error != null && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          {t("Failed to load invitations.")}
        </Alert>
      )}

      {!isLoading && !error && invitations.length === 0 && (
        <Alert>
          {t("No invitations yet. Use the form above to invite your first user.")}
        </Alert>
      )}

      {!isLoading && invitations.length > 0 && (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Email")}</TableHead>
                <TableHead>{t("Role")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Sent")}</TableHead>
                <TableHead>{t("Expires")}</TableHead>
                <TableHead className="text-center">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => {
                const canRevoke = invitation.status === "pending" && hasActiveBilling;
                return (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel(invitation.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[invitation.status]}>
                        {invitationStatusLabel(invitation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(invitation.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(invitation.expiresAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyLink(invitation)}
                                disabled={invitation.status !== "pending"}
                                aria-label={t("Copy invite link")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedId === invitation.id
                              ? t("Copied!")
                              : t("Copy invite link")}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={!canRevoke || revokeMutation.isPending}
                                onClick={() =>
                                  revokeMutation.mutate(invitation.id)
                                }
                                aria-label={t("Revoke invitation")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {canRevoke ? t("Revoke invitation") : "—"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

    </div>
  );
}
