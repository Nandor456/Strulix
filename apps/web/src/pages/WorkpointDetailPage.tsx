import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock,
  Copy,
  Download,
  FileText,
  FileSpreadsheet,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkPointDocumentsDialog } from "@/components/workpoints/WorkPointDocumentsDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useDeleteAttendance,
  useManualMark,
  useRotateQrToken,
  useUpdateAttendanceTimes,
  useWorkPointAttendance,
  useWorkPointQr,
} from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useWorkPoint } from "@/hooks/useWorkPoints";
import {
  useAssignWorker,
  useRemoveWorker,
  useWorkers,
  useWorkPointWorkers,
} from "@/hooks/useWorkers";
import { attendanceAPI, type AttendanceRecord } from "@/services/api/attendanceApi";
import {
  formatDate,
  formatDateTime,
  formatHours,
  getCurrentPeriod,
  getMonthBounds,
} from "@/lib/format";
import { useI18n } from "@/hooks/useI18n";

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getDateTimeInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function localDateTimeToIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function getAttendanceHours(record: AttendanceRecord) {
  if (!record.checkedOutAt) return null;
  const start = new Date(record.checkedInAt).getTime();
  const end = new Date(record.checkedOutAt).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export default function WorkpointDetailPage() {
  const navigate = useNavigate();
  const { id: workPointId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === "ADMIN";
  const canManageWorkPointDocuments =
    user?.role === "ADMIN" || user?.role === "LEADER";

  const currentPeriod = getCurrentPeriod();
  const currentBounds = getMonthBounds(currentPeriod);

  const { data: workPoint, isLoading, error } = useWorkPoint(workPointId ?? null);
  const { data: workers = [] } = useWorkers();
  const { data: assignedWorkers = [] } = useWorkPointWorkers(workPointId ?? null);

  const assignmentIds = useMemo(
    () => new Set(assignedWorkers.map((worker) => worker.id)),
    [assignedWorkers],
  );
  const availableWorkers = workers.filter((worker) => !assignmentIds.has(worker.id));
  const assignWorker = useAssignWorker(workPointId ?? null);
  const removeWorker = useRemoveWorker(workPointId ?? null);

  const [from, setFrom] = useState(currentBounds.from);
  const [to, setTo] = useState(currentBounds.to);
  const attendanceParams = useMemo(() => ({ from, to }), [from, to]);
  const { data: attendance = [], isLoading: isAttendanceLoading } =
    useWorkPointAttendance(workPointId ?? "", attendanceParams);
  const manualMark = useManualMark(workPointId ?? "");
  const updateAttendanceTimes = useUpdateAttendanceTimes(workPointId ?? "");
  const deleteAttendance = useDeleteAttendance(workPointId ?? "");
  const { data: qr, isLoading: isQrLoading } = useWorkPointQr(workPointId ?? "");
  const rotateQr = useRotateQrToken(workPointId ?? "");

  const [manualWorkerId, setManualWorkerId] = useState("");
  const [manualDate, setManualDate] = useState(getTodayInputValue());
  const [manualCheckedInAt, setManualCheckedInAt] = useState(`${getTodayInputValue()}T08:00`);
  const [manualCheckedOutAt, setManualCheckedOutAt] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualAttendanceOpen, setIsManualAttendanceOpen] = useState(false);
  const [assignWorkerId, setAssignWorkerId] = useState("");
  const [attendanceTimeRecord, setAttendanceTimeRecord] =
    useState<AttendanceRecord | null>(null);
  const [attendanceCheckedInValue, setAttendanceCheckedInValue] = useState("");
  const [attendanceCheckedOutValue, setAttendanceCheckedOutValue] = useState("");
  const [attendanceTimeError, setAttendanceTimeError] = useState<string | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);

  const scanUrl = qr ? `${window.location.origin}/checkin/${qr.qrToken}` : "";

  async function handleAssignWorker(workerId: string) {
    await assignWorker.mutateAsync(workerId);
    setAssignWorkerId("");
  }

  async function handleRemoveWorker(workerId: string) {
    await removeWorker.mutateAsync(workerId);
  }

  function resetManualAttendanceForm() {
    const today = getTodayInputValue();
    setManualWorkerId("");
    setManualDate(today);
    setManualCheckedInAt(`${today}T08:00`);
    setManualCheckedOutAt("");
    setManualError(null);
  }

  async function handleManualAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workPointId || !manualWorkerId || !manualDate) return;
    setManualError(null);

    try {
      await manualMark.mutateAsync({
        workerId: manualWorkerId,
        date: manualDate,
        checkedInAt: localDateTimeToIso(manualCheckedInAt),
        checkedOutAt: localDateTimeToIso(manualCheckedOutAt),
      });
      resetManualAttendanceForm();
      setIsManualAttendanceOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        t("Failed to add attendance");
      setManualError(message);
    }
  }

  function openAttendanceTimeDialog(record: AttendanceRecord) {
    setAttendanceTimeRecord(record);
    setAttendanceCheckedInValue(getDateTimeInputValue(record.checkedInAt));
    setAttendanceCheckedOutValue(getDateTimeInputValue(record.checkedOutAt));
    setAttendanceTimeError(null);
  }

  function closeAttendanceTimeDialog() {
    setAttendanceTimeRecord(null);
    setAttendanceCheckedInValue("");
    setAttendanceCheckedOutValue("");
    setAttendanceTimeError(null);
  }

  async function handleAttendanceTimesSave() {
    if (!attendanceTimeRecord || !attendanceCheckedInValue) return;
    setAttendanceTimeError(null);

    try {
      await updateAttendanceTimes.mutateAsync({
        id: attendanceTimeRecord.id,
        checkedInAt: new Date(attendanceCheckedInValue).toISOString(),
        checkedOutAt: attendanceCheckedOutValue
          ? new Date(attendanceCheckedOutValue).toISOString()
          : null,
      });
      closeAttendanceTimeDialog();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        t("Failed to update attendance hours");
      setAttendanceTimeError(message);
    }
  }

  async function handleDeleteAttendance(record: AttendanceRecord) {
    if (
      !window.confirm(
        t("Delete attendance for {name}?", { name: record.worker.username }),
      )
    ) {
      return;
    }
    await deleteAttendance.mutateAsync(record.id);
  }

  async function handleExport() {
    if (!workPointId || !workPoint) return;
    setIsExporting(true);
    try {
      const blob = await attendanceAPI.exportXlsx(workPointId, { from, to });
      const safeName = workPoint.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      downloadBlob(blob, `attendance-${safeName || workPointId}-${from}-to-${to}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleCopyQr() {
    if (!scanUrl) return;
    await navigator.clipboard.writeText(scanUrl);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 1500);
  }

  async function handleRotateQr() {
    if (!workPointId) return;
    if (
      !window.confirm(
        t("Rotate this QR code? Existing printed codes will stop working."),
      )
    ) {
      return;
    }
    await rotateQr.mutateAsync();
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/workpoints")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">{t("Workpoint details")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("Manage assignments, attendance, QR access, and exports for this site.")}
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={36} />
        </div>
      )}

      {error != null && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          {t("Failed to load this workpoint.")}
        </Alert>
      )}

      {!isLoading && !error && !workPoint && (
        <Alert>{t("That workpoint could not be found.")}</Alert>
      )}

      {workPoint && (
        <div className="space-y-4">
          <div className="rounded-md border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{workPoint.name}</h2>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {workPoint.address}
                </p>
                {workPoint.description && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {workPoint.description}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-44">
                <div className="rounded-md bg-muted/70 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{t("Workers")}</p>
                  <p className="font-semibold tabular-nums">{workPoint.workerCount}</p>
                </div>
                <div className="rounded-md bg-muted/70 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{t("Records")}</p>
                  <p className="font-semibold tabular-nums">{workPoint.attendanceCount}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                {t("Deadline")}: {formatDate(workPoint.deadline)}
              </span>
              <span>
                {t("Created")}: {formatDate(workPoint.uploadedAt)}
              </span>
              {workPoint.lat != null && workPoint.lng != null && (
                <span>
                  {workPoint.lat}, {workPoint.lng}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-md border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{t("Workpoint documents")}</h3>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDocumentsOpen(true)}
                disabled={!canManageWorkPointDocuments}
              >
                <FileText className="h-4 w-4" />
                {t("Documents")}
              </Button>
            </div>
          </div>

          <div className="rounded-md border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{t("Assigned workers")}</h3>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Select
                value={assignWorkerId}
                onValueChange={setAssignWorkerId}
                disabled={availableWorkers.length === 0 || assignWorker.isPending}
              >
                <SelectTrigger className="sm:flex-1">
                  <SelectValue placeholder={t("Assign worker")} />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.username} ({worker.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => void handleAssignWorker(assignWorkerId)}
                disabled={!assignWorkerId || assignWorker.isPending}
              >
                <UserPlus className="h-4 w-4" />
                {t("Assign")}
              </Button>
            </div>

            {assignedWorkers.length === 0 ? (
              <Alert>{t("No workers assigned to this workpoint.")}</Alert>
            ) : (
              <div className="space-y-2">
                {assignedWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{worker.username}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {worker.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {worker.hourlyWage == null
                          ? t("No wage")
                          : t("{amount} RON/h", {
                            amount: worker.hourlyWage.toFixed(2),
                          })}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => void handleRemoveWorker(worker.id)}
                            disabled={removeWorker.isPending}
                            aria-label={t("Remove worker")}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("Remove worker")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{t("QR check-in")}</h3>
              </div>
              {isQrLoading && <Spinner size={16} />}
            </div>

            {qr ? (
              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                <div className="rounded-md border bg-white p-3">
                  <img
                    src={qr.qrPng}
                    alt={t("Workpoint check-in QR code")}
                    className="w-full"
                  />
                </div>
                <div className="min-w-0 space-y-3">
                  <Input value={scanUrl} readOnly />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => void handleCopyQr()}>
                      {copiedQr ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedQr ? t("Copied!") : t("Copy link")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadDataUrl(qr.qrPng, `${workPoint.name}-qr.png`)}
                    >
                      <Download className="h-4 w-4" />
                      {t("Download QR")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleRotateQr()}
                      disabled={rotateQr.isPending}
                    >
                      {rotateQr.isPending ? (
                        <Spinner size={16} />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {t("Rotate")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>{t("QR code is not available yet.")}</Alert>
            )}
          </div>

          <div className="rounded-md border bg-card p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{t("Attendance")}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("Filter records and export the same period to Excel.")}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="attendance-from">{t("From")}</Label>
                  <Input
                    id="attendance-from"
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="attendance-to">{t("To")}</Label>
                  <Input
                    id="attendance-to"
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => void handleExport()}
                  disabled={isExporting}
                >
                  {isExporting ? <Spinner size={16} /> : <FileSpreadsheet className="h-4 w-4" />}
                  {t("Export")}
                </Button>
                <Button
                  onClick={() => {
                    setManualError(null);
                    setIsManualAttendanceOpen(true);
                  }}
                  disabled={assignedWorkers.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  {t("Manual mark")}
                </Button>
              </div>
            </div>

            {isAttendanceLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size={28} />
              </div>
            ) : attendance.length === 0 ? (
              <Alert>{t("No attendance records for this period.")}</Alert>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Worker")}</TableHead>
                      <TableHead>{t("Date")}</TableHead>
                      <TableHead>{t("Source")}</TableHead>
                      <TableHead>{t("Check in")}</TableHead>
                      <TableHead>{t("Check out")}</TableHead>
                      <TableHead className="text-right">{t("Hours")}</TableHead>
                      <TableHead className="text-center">{t("Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => {
                      const hours = getAttendanceHours(record);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.worker.username}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.source === "QR" ? "success" : "outline"}>
                              {record.source}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(record.checkedInAt)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>
                                {record.checkedOutAt
                                  ? formatDateTime(record.checkedOutAt)
                                  : t("Open")}
                              </span>
                              {record.checkoutSource === "AUTO" && (
                                <Badge
                                  variant="destructive"
                                  title={t(
                                    "Automatically closed at 22:00. Edit to mark reviewed.",
                                  )}
                                >
                                  <CircleAlert className="h-3 w-3" />
                                  {t("Auto")}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {hours == null ? t("Open") : formatHours(hours)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              {isAdmin && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openAttendanceTimeDialog(record)}
                                      aria-label={t("Edit attendance hours")}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t("Edit hours")}</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => void handleDeleteAttendance(record)}
                                    aria-label={t("Delete attendance")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t("Delete attendance")}</TooltipContent>
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
        </div>
      )}

      <Dialog
        open={isManualAttendanceOpen}
        onOpenChange={(open) => {
          setIsManualAttendanceOpen(open);
          if (!open) {
            resetManualAttendanceForm();
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Manual attendance")}</DialogTitle>
            <DialogDescription>
              {t("Add a check-in and optional check-out for an assigned worker.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleManualAttendance(event)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="manual-worker">{t("Worker")}</Label>
                <Select value={manualWorkerId} onValueChange={setManualWorkerId}>
                  <SelectTrigger id="manual-worker">
                    <SelectValue placeholder={t("Choose worker")} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedWorkers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="manual-date">{t("Date")}</Label>
                <Input
                  id="manual-date"
                  type="date"
                  value={manualDate}
                  onChange={(event) => setManualDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="manual-in">{t("Check in")}</Label>
                <Input
                  id="manual-in"
                  type="datetime-local"
                  value={manualCheckedInAt}
                  onChange={(event) => setManualCheckedInAt(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="manual-out">{t("Check out")}</Label>
                <Input
                  id="manual-out"
                  type="datetime-local"
                  value={manualCheckedOutAt}
                  onChange={(event) => setManualCheckedOutAt(event.target.value)}
                />
              </div>
            </div>
            {manualError && <Alert variant="destructive">{manualError}</Alert>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetManualAttendanceForm();
                  setIsManualAttendanceOpen(false);
                }}
              >
                <X className="h-4 w-4" />
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={!manualWorkerId || manualMark.isPending}>
                {manualMark.isPending ? <Spinner size={16} /> : <Plus className="h-4 w-4" />}
                {t("Add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {workPoint && (
        <WorkPointDocumentsDialog
          canManage={canManageWorkPointDocuments}
          open={isDocumentsOpen}
          onOpenChange={setIsDocumentsOpen}
          workPointId={workPointId ?? null}
          workPointName={workPoint.name}
        />
      )}

      <Dialog
        open={attendanceTimeRecord !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeAttendanceTimeDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Edit attendance hours")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-checkin-at">{t("Check-in time")}</Label>
            <Input
              id="attendance-checkin-at"
              type="datetime-local"
              value={attendanceCheckedInValue}
              onChange={(event) => setAttendanceCheckedInValue(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-checkout-at">{t("Check-out time")}</Label>
            <Input
              id="attendance-checkout-at"
              type="datetime-local"
              value={attendanceCheckedOutValue}
              onChange={(event) => setAttendanceCheckedOutValue(event.target.value)}
            />
          </div>
          {attendanceTimeError && (
            <Alert variant="destructive">{attendanceTimeError}</Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAttendanceTimeDialog}
            >
              <X className="h-4 w-4" />
              {t("Cancel")}
            </Button>
            <Button
              onClick={() => void handleAttendanceTimesSave()}
              disabled={!attendanceCheckedInValue || updateAttendanceTimes.isPending}
            >
              {updateAttendanceTimes.isPending ? (
                <Spinner size={16} />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
