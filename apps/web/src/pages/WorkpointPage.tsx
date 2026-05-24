import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateWorkPoint,
  useDeleteWorkPoint,
  useUpdateWorkPoint,
  useWorkPoints,
} from "@/hooks/useWorkPoints";
import { useWorkers } from "@/hooks/useWorkers";
import type {
  WorkPointInput,
  WorkPointSummary,
  WorkPointUpdate,
} from "@/services/api/workPointApi";
import { formatDate } from "@/lib/format";

type WorkPointFormState = {
  name: string;
  address: string;
  description: string;
  deadline: string;
  workerIds: string[];
};

const EMPTY_FORM: WorkPointFormState = {
  name: "",
  address: "",
  description: "",
  deadline: "",
  workerIds: [],
};

function deadlineToInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formFromWorkPoint(workPoint: WorkPointSummary): WorkPointFormState {
  return {
    name: workPoint.name,
    address: workPoint.address,
    description: workPoint.description ?? "",
    deadline: deadlineToInput(workPoint.deadline),
    workerIds: [],
  };
}

function buildWorkPointPayload(form: WorkPointFormState): WorkPointUpdate {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    description: form.description.trim() || null,
    deadline: form.deadline ? new Date(`${form.deadline}T00:00:00`).toISOString() : null,
  };
}

export default function WorkpointPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: workPoints = [], isLoading, error } = useWorkPoints();
  const { data: workers = [] } = useWorkers();
  const createWorkPoint = useCreateWorkPoint();
  const updateWorkPoint = useUpdateWorkPoint();
  const deleteWorkPoint = useDeleteWorkPoint();

  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<WorkPointFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<WorkPointSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkPointSummary | null>(null);

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setFormMode("create");
    setFormError(null);
  }

  function openEditDialog(workPoint: WorkPointSummary) {
    setForm(formFromWorkPoint(workPoint));
    setEditTarget(workPoint);
    setFormMode("edit");
    setFormError(null);
  }

  function closeFormDialog() {
    setFormMode(null);
    setEditTarget(null);
    setFormError(null);
  }

  function toggleInitialWorker(workerId: string) {
    setForm((current) => ({
      ...current,
      workerIds: current.workerIds.includes(workerId)
        ? current.workerIds.filter((id) => id !== workerId)
        : [...current.workerIds, workerId],
    }));
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const basePayload = buildWorkPointPayload(form);
    if (!basePayload.name || !basePayload.address) {
      setFormError(t("Name and address are required."));
      return;
    }

    try {
      if (formMode === "create") {
        const payload: WorkPointInput = {
          ...basePayload,
          workerIds: form.workerIds,
        };
        const created = await createWorkPoint.mutateAsync(payload);
        closeFormDialog();
        navigate(`/workpoints/${created.id}`);
        return;
      }

      if (formMode === "edit" && editTarget) {
        await updateWorkPoint.mutateAsync({
          id: editTarget.id,
          data: basePayload,
        });
      }

      closeFormDialog();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        t("Failed to save workpoint");
      setFormError(message);
    }
  }

  async function handleDeleteWorkPoint() {
    if (!deleteTarget) return;
    await deleteWorkPoint.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">{t("Workpoints")}</h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "Browse your job sites and open one to manage its workers, attendance, and QR tools.",
              )}
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {t("New workpoint")}
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={36} />
        </div>
      )}

      {error != null && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          {t("Failed to load workpoints.")}
        </Alert>
      )}

      {!isLoading && !error && workPoints.length === 0 && (
        <Alert>{t("No workpoints yet. Create one to start assigning workers.")}</Alert>
      )}

      {!isLoading && workPoints.length > 0 && (
        <div className="overflow-hidden rounded-md border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{t("All workpoints")}</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Address")}</TableHead>
                  <TableHead className="text-center">{t("Workers")}</TableHead>
                  <TableHead className="text-center">{t("Attendance")}</TableHead>
                  <TableHead className="text-center">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workPoints.map((workPoint) => (
                  <TableRow
                    key={workPoint.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/workpoints/${workPoint.id}`)}
                  >
                    <TableCell className="min-w-56 font-medium">
                      <div>{workPoint.name}</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("Deadline")}: {formatDate(workPoint.deadline)}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-72 text-sm text-muted-foreground">
                      {workPoint.address}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {workPoint.workerCount}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {workPoint.attendanceCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/workpoints/${workPoint.id}`);
                              }}
                              aria-label={t("Open workpoint")}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("Open workpoint")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditDialog(workPoint);
                              }}
                              aria-label={t("Edit workpoint")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("Edit workpoint")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget(workPoint);
                              }}
                              aria-label={t("Delete workpoint")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("Delete workpoint")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={formMode !== null} onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? t("Create workpoint") : t("Edit workpoint")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void handleFormSubmit(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workpoint-name">{t("Name")}</Label>
                <Input
                  id="workpoint-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workpoint-address">{t("Address")}</Label>
                <Input
                  id="workpoint-address"
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("Coordinates are generated automatically from the address.")}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workpoint-deadline">{t("Deadline")}</Label>
                <Input
                  id="workpoint-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(event) => setForm({ ...form, deadline: event.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workpoint-description">{t("Description")}</Label>
              <Textarea
                id="workpoint-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={3}
              />
            </div>

            {formMode === "create" && (
              <div className="rounded-md border p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("Initial workers")}</h3>
                </div>
                {workers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("No workers available.")}</p>
                ) : (
                  <div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                    {workers.map((worker) => (
                      <label
                        key={worker.id}
                        className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.workerIds.includes(worker.id)}
                          onChange={() => toggleInitialWorker(worker.id)}
                          className="mt-0.5 h-4 w-4 accent-primary"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{worker.username}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {worker.email}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createWorkPoint.isPending || updateWorkPoint.isPending}
              >
                {(createWorkPoint.isPending || updateWorkPoint.isPending) && <Spinner size={16} />}
                {createWorkPoint.isPending || updateWorkPoint.isPending
                  ? t("Saving...")
                  : t("Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Delete workpoint")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t(
              "Delete {name}? Attendance, assignments, and the workpoint chat will be removed.",
              { name: deleteTarget?.name ?? "" },
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteWorkPoint()}
              disabled={deleteWorkPoint.isPending}
            >
              {deleteWorkPoint.isPending && <Spinner size={16} />}
              {t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
