import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useDeleteWorkPointDocument,
  useUploadWorkPointDocument,
  useWorkPointDocuments,
} from "@/hooks/useWorkPointDocuments";
import { useI18n } from "@/hooks/useI18n";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getWorkPointDocumentFileUrl,
  type WorkPointDocumentSummary,
} from "@/services/api/workPointDocumentApi";

function getDocumentKind(
  document: WorkPointDocumentSummary,
  t: (key: string) => string,
) {
  if (document.mimeType === "application/pdf") return t("PDF");
  if (document.mimeType.startsWith("image/")) return t("Image");
  return t("File");
}

function isImage(document: WorkPointDocumentSummary) {
  return document.mimeType.startsWith("image/");
}

function isPdf(document: WorkPointDocumentSummary) {
  return document.mimeType === "application/pdf";
}

function DocumentIcon({ document }: { document: WorkPointDocumentSummary }) {
  if (isImage(document)) return <FileImage className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export function WorkPointDocumentsDialog({
  canManage,
  onOpenChange,
  open,
  workPointId,
  workPointName,
}: {
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  workPointId: string | null;
  workPointName: string;
}) {
  const { t } = useI18n();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading, error } =
    useWorkPointDocuments(open ? workPointId : null);
  const uploadDocumentMutation = useUploadWorkPointDocument(workPointId);
  const deleteDocumentMutation = useDeleteWorkPointDocument();

  const selectedDocument = useMemo(
    () =>
      documents.find((document) => document.id === selectedDocumentId) ??
      documents[0] ??
      null,
    [documents, selectedDocumentId],
  );

  useEffect(() => {
    if (!open) return;
    if (!selectedDocument) {
      setSelectedDocumentId(null);
      return;
    }
    if (selectedDocumentId !== selectedDocument.id) {
      setSelectedDocumentId(selectedDocument.id);
    }
  }, [open, selectedDocument, selectedDocumentId]);

  function resetUploadState() {
    setDocumentFile(null);
    setDocumentError(null);
    if (documentFileInputRef.current) {
      documentFileInputRef.current.value = "";
    }
  }

  async function handleDocumentUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentFile) return;

    setDocumentError(null);
    try {
      await uploadDocumentMutation.mutateAsync(documentFile);
      resetUploadState();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? t("Failed to upload document");
      setDocumentError(message);
    }
  }

  async function handleDocumentDelete(document: WorkPointDocumentSummary) {
    if (!window.confirm(t("Delete {name}?", { name: document.originalName }))) return;
    await deleteDocumentMutation.mutateAsync(document.id);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetUploadState();
          setSelectedDocumentId(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {t("Documents for {name}", { name: workPointName })}
          </DialogTitle>
        </DialogHeader>

        {canManage && (
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
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size={28} />
          </div>
        ) : error ? (
          <Alert variant="destructive">{t("Failed to load workpoint documents.")}</Alert>
        ) : documents.length === 0 ? (
          <Alert>{t("No documents uploaded for this workpoint.")}</Alert>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
            <div className="rounded-md border">
              <div className="divide-y">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2",
                      selectedDocument?.id === document.id && "bg-muted/60",
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-start gap-2 text-left"
                      onClick={() => setSelectedDocumentId(document.id)}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <DocumentIcon document={document} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {document.originalName}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="outline">{getDocumentKind(document, t)}</Badge>
                          <span>{formatFileSize(document.sizeBytes)}</span>
                        </span>
                      </span>
                    </button>
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={getWorkPointDocumentFileUrl(document.id, true)}
                        aria-label={t("Download document")}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-md border">
              {selectedDocument ? (
                <>
                  <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <DocumentIcon document={selectedDocument} />
                        <h2 className="truncate text-base font-semibold">
                          {selectedDocument.originalName}
                        </h2>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("Uploaded {date}", {
                          date: formatDateTime(selectedDocument.createdAt),
                        })}
                        {selectedDocument.uploadedBy
                          ? ` ${t("by {name}", {
                              name: selectedDocument.uploadedBy.username,
                            })}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" asChild>
                        <a
                          href={getWorkPointDocumentFileUrl(selectedDocument.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {t("Open")}
                        </a>
                      </Button>
                      <Button asChild>
                        <a href={getWorkPointDocumentFileUrl(selectedDocument.id, true)}>
                          <Download className="h-4 w-4" />
                          {t("Download")}
                        </a>
                      </Button>
                      {canManage && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => void handleDocumentDelete(selectedDocument)}
                              disabled={deleteDocumentMutation.isPending}
                              aria-label={t("Delete document")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("Delete document")}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {isPdf(selectedDocument) ? (
                      <iframe
                        src={getWorkPointDocumentFileUrl(selectedDocument.id)}
                        title={selectedDocument.originalName}
                        className="h-[68vh] min-h-[360px] w-full rounded-md border bg-background"
                      />
                    ) : isImage(selectedDocument) ? (
                      <div className="flex min-h-[360px] items-center justify-center rounded-md border bg-muted/30 p-3">
                        <img
                          src={getWorkPointDocumentFileUrl(selectedDocument.id)}
                          alt={selectedDocument.originalName}
                          className="max-h-[68vh] max-w-full rounded-md object-contain"
                        />
                      </div>
                    ) : (
                      <Alert>{t("Preview is not available for this document.")}</Alert>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-4">
                  <Alert>{t("Select a document to preview it.")}</Alert>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
