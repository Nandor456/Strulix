import { useRef, useState, type FormEvent } from "react";
import { Download, ExternalLink, FileText, Pencil, Trash2, Upload, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
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
import { useI18n } from "@/hooks/useI18n";
import {
    useDeleteWorker,
    useUpdateWorker,
    useWorkers,
} from "../hooks/useWorkers";
import {
    useDeleteWorkerDocument,
    useUploadWorkerDocument,
    useWorkerDocuments,
} from "../hooks/useWorkerDocuments";
import { useAuth } from "../hooks/useAuth";
import { formatDateTime, formatFileSize } from "../lib/format";
import type { WorkerSummary } from "../services/api/workerApi";
import {
    getWorkerDocumentFileUrl,
    type WorkerDocumentSummary,
} from "../services/api/workerDocumentApi";

const EDITABLE_ROLES = ["WORKER", "LEADER"];

function getDocumentKind(
    document: WorkerDocumentSummary,
    t: (key: string, params?: Record<string, string | number>) => string,
) {
    if (document.mimeType === "application/pdf") return t("PDF");
    if (document.mimeType.startsWith("image/")) return t("Image");
    return t("File");
}

export default function WorkerManagementPage() {
    const { t, roleLabel } = useI18n();
    const { user } = useAuth();
    const canManageWorkerAccounts = user?.role === "ADMIN" || user?.role === "LEADER"; // Only admins and leaders can manage worker accounts
    const { data: workers = [], isLoading } = useWorkers();
    const updateWorkerMutation = useUpdateWorker();
    const deleteWorkerMutation = useDeleteWorker();

    const [editWorker, setEditWorker] = useState<WorkerSummary | null>(null);
    const [editUsername, setEditUsername] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("");
    const [editWage, setEditWage] = useState("");
    const [editError, setEditError] = useState<string | null>(null);

    const [deleteWorker, setDeleteWorker] = useState<WorkerSummary | null>(null);
    const [documentsWorker, setDocumentsWorker] = useState<WorkerSummary | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentError, setDocumentError] = useState<string | null>(null);
    const documentFileInputRef = useRef<HTMLInputElement>(null);

    const { data: workerDocuments = [], isLoading: isDocumentsLoading } =
        useWorkerDocuments(documentsWorker?.id ?? null);
    const uploadDocumentMutation = useUploadWorkerDocument(documentsWorker?.id ?? null);
    const deleteDocumentMutation = useDeleteWorkerDocument();

    function openEditDialog(worker: WorkerSummary) {
        setEditWorker(worker);
        setEditUsername(worker.username);
        setEditEmail(worker.email);
        setEditRole(worker.role);
        setEditWage(worker.hourlyWage != null ? String(worker.hourlyWage) : "");
        setEditError(null);
    }

    function closeEditDialog() {
        setEditWorker(null);
        setEditError(null);
    }

    function openDocumentsDialog(worker: WorkerSummary) {
        setDocumentsWorker(worker);
        setDocumentFile(null);
        setDocumentError(null);
        if (documentFileInputRef.current) {
            documentFileInputRef.current.value = "";
        }
    }

    function closeDocumentsDialog() {
        setDocumentsWorker(null);
        setDocumentFile(null);
        setDocumentError(null);
        if (documentFileInputRef.current) {
            documentFileInputRef.current.value = "";
        }
    }

    async function handleEditSave() {
        if (!editWorker) return;
        setEditError(null);
        const parsedWage = editWage.trim() !== "" ? parseFloat(editWage) : null;
        try {
            await updateWorkerMutation.mutateAsync({
                workerId: editWorker.id,
                data: {
                    username: editUsername.trim(),
                    email: editEmail.trim(),
                    role: editRole,
                    hourlyWage: parsedWage,
                },
            });
            closeEditDialog();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { error?: string } } })?.response?.data
                    ?.error ?? t("Failed to update worker");
            setEditError(message);
        }
    }

    async function handleDeleteConfirm() {
        if (!deleteWorker) return;
        await deleteWorkerMutation.mutateAsync(deleteWorker.id);
        setDeleteWorker(null);
    }

    async function handleDocumentUpload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!documentFile) return;

        setDocumentError(null);
        try {
            await uploadDocumentMutation.mutateAsync(documentFile);
            setDocumentFile(null);
            if (documentFileInputRef.current) {
                documentFileInputRef.current.value = "";
            }
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { error?: string } } })?.response?.data
                    ?.error ?? t("Failed to upload document");
            setDocumentError(message);
        }
    }

    async function handleDocumentDelete(document: WorkerDocumentSummary) {
        if (!window.confirm(t("Delete {name}?", { name: document.originalName }))) return;
        await deleteDocumentMutation.mutateAsync(document.id);
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
            <div className="mb-6 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-semibold">{t("Team members")}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t("Manage registered workers and leaders, wages, and documents.")}
                    </p>
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <Spinner size={36} />
                </div>
            )}

            {!isLoading && workers.length === 0 && (
                <Alert>{t("No workers or leaders registered yet.")}</Alert>
            )}

            {!isLoading && workers.length > 0 && (
                <div className="overflow-hidden rounded-md border bg-card">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">{t("All team members")}</h2>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("Username")}</TableHead>
                                <TableHead>{t("Email")}</TableHead>
                                <TableHead>{t("Role")}</TableHead>
                                <TableHead className="text-center">{t("Workpoints")}</TableHead>
                                <TableHead className="text-right">{t("Hourly wage")}</TableHead>
                                <TableHead className="text-center">{t("Actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium">
                                        {worker.username}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {worker.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{roleLabel(worker.role)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">
                                        {worker.assignedWorkPointCount}
                                    </TableCell>
                                    <TableCell className="text-right text-sm tabular-nums">
                                        {worker.hourlyWage != null ? (
                                            t("{amount} RON/h", {
                                                amount: worker.hourlyWage.toFixed(2),
                                            })
                                        ) : (
                                            <span className="text-muted-foreground">{t("Not set")}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDocumentsDialog(worker)}
                                                        aria-label={t("Manage worker documents")}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("Documents")}</TooltipContent>
                                            </Tooltip>
                                            {canManageWorkerAccounts && (
                                                <>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditDialog(worker)}
                                                                aria-label={t("Edit team member")}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{t("Edit team member")}</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => setDeleteWorker(worker)}
                                                                aria-label={t("Delete team member")}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{t("Delete team member")}</TooltipContent>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog
                open={documentsWorker !== null}
                onOpenChange={(open) => !open && closeDocumentsDialog()}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {documentsWorker
                                ? t("Documents for {name}", {
                                    name: documentsWorker.username,
                                })
                                : t("Documents")}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => void handleDocumentUpload(event)}
                        className="rounded-md border bg-muted/30 p-3"
                    >
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                ref={documentFileInputRef}
                                type="file"
                                accept="application/pdf,image/png,image/jpeg,image/webp"
                                onChange={(event) =>
                                    setDocumentFile(event.target.files?.[0] ?? null)
                                }
                            />
                            <Button
                                type="submit"
                                disabled={!documentFile || uploadDocumentMutation.isPending}
                            >
                                {uploadDocumentMutation.isPending ? (
                                    <Spinner size={16} />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                {t("Upload")}
                            </Button>
                        </div>
                        {documentError && (
                            <Alert variant="destructive" className="mt-3">
                                {documentError}
                            </Alert>
                        )}
                    </form>

                    {isDocumentsLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size={28} />
                        </div>
                    ) : workerDocuments.length === 0 ? (
                        <Alert>{t("No documents uploaded for this worker.")}</Alert>
                    ) : (
                        <div className="space-y-2">
                            {workerDocuments.map((document) => (
                                <div
                                    key={document.id}
                                    className="flex flex-col gap-3 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-sm font-medium">
                                                {document.originalName}
                                            </p>
                                            <Badge variant="outline">
                                                {getDocumentKind(document, t)}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatFileSize(document.sizeBytes)} ·{" "}
                                            {t("Uploaded {date}", {
                                                date: formatDateTime(document.createdAt),
                                            })}
                                            {document.uploadedBy
                                                ? ` ${t("by {name}", {
                                                    name: document.uploadedBy.username,
                                                })}`
                                                : ""}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 justify-end gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a
                                                        href={getWorkerDocumentFileUrl(document.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={t("Preview document")}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t("Preview document")}</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a
                                                        href={getWorkerDocumentFileUrl(
                                                            document.id,
                                                            true,
                                                        )}
                                                        aria-label={t("Download document")}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t("Download document")}</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => void handleDocumentDelete(document)}
                                                    disabled={deleteDocumentMutation.isPending}
                                                    aria-label={t("Delete document")}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t("Delete document")}</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={editWorker !== null}
                onOpenChange={(open) => !open && closeEditDialog()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("Edit team member")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-username">{t("Username")}</Label>
                            <Input
                                id="edit-username"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-email">{t("Email")}</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-role">{t("Role")}</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger id="edit-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EDITABLE_ROLES.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {roleLabel(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-wage">{t("Hourly wage (RON)")}</Label>
                            <Input
                                id="edit-wage"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={t("e.g. 35.50")}
                                value={editWage}
                                onChange={(e) => setEditWage(e.target.value)}
                            />
                        </div>
                        {editError && <Alert variant="destructive">{editError}</Alert>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeEditDialog}>
                            {t("Cancel")}
                        </Button>
                        <Button
                            onClick={handleEditSave}
                            disabled={updateWorkerMutation.isPending}
                        >
                            {updateWorkerMutation.isPending && <Spinner size={16} />}
                            {updateWorkerMutation.isPending ? t("Saving…") : t("Save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteWorker !== null}
                onOpenChange={(open) => !open && setDeleteWorker(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t("Delete team member")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        {t("Are you sure you want to delete {name}? This action cannot be undone.", {
                            name: deleteWorker?.username ?? "",
                        })}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteWorker(null)}>
                            {t("Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteWorkerMutation.isPending}
                        >
                            {deleteWorkerMutation.isPending && <Spinner size={16} />}
                            {deleteWorkerMutation.isPending ? t("Deleting…") : t("Delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
