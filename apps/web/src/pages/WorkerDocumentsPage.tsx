import { useMemo, useState } from "react";
import { Download, ExternalLink, FileImage, FileText } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { useMyWorkerDocuments } from "@/hooks/useWorkerDocuments";
import {
  getWorkerDocumentFileUrl,
  type WorkerDocumentSummary,
} from "@/services/api/workerDocumentApi";

function getDocumentKind(document: WorkerDocumentSummary) {
  if (document.mimeType === "application/pdf") return "PDF";
  if (document.mimeType.startsWith("image/")) return "Image";
  return "File";
}

function isImage(document: WorkerDocumentSummary) {
  return document.mimeType.startsWith("image/");
}

function isPdf(document: WorkerDocumentSummary) {
  return document.mimeType === "application/pdf";
}

function DocumentIcon({ document }: { document: WorkerDocumentSummary }) {
  if (isImage(document)) return <FileImage className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export default function WorkerDocumentsPage() {
  const { data: documents = [], isLoading, error } = useMyWorkerDocuments();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const selectedDocument = useMemo(
    () =>
      documents.find((document) => document.id === selectedDocumentId) ??
      documents[0] ??
      null,
    [documents, selectedDocumentId],
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Preview and download documents shared with your worker profile.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={36} />
        </div>
      )}

      {error != null && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          Failed to load your documents.
        </Alert>
      )}

      {!isLoading && !error && documents.length === 0 && (
        <Alert>No documents have been shared with you yet.</Alert>
      )}

      {!isLoading && !error && documents.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <div className="rounded-md border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Your documents</h2>
            </div>
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
                        <Badge variant="outline">{getDocumentKind(document)}</Badge>
                        <span>{formatFileSize(document.sizeBytes)}</span>
                      </span>
                    </span>
                  </button>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={getWorkerDocumentFileUrl(document.id, true)}
                      aria-label="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-md border bg-card">
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
                      Uploaded {formatDateTime(selectedDocument.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" asChild>
                      <a
                        href={getWorkerDocumentFileUrl(selectedDocument.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                    <Button asChild>
                      <a href={getWorkerDocumentFileUrl(selectedDocument.id, true)}>
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  {isPdf(selectedDocument) ? (
                    <iframe
                      src={getWorkerDocumentFileUrl(selectedDocument.id)}
                      title={selectedDocument.originalName}
                      className="h-[70vh] min-h-[420px] w-full rounded-md border bg-background"
                    />
                  ) : isImage(selectedDocument) ? (
                    <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-muted/30 p-3">
                      <img
                        src={getWorkerDocumentFileUrl(selectedDocument.id)}
                        alt={selectedDocument.originalName}
                        className="max-h-[70vh] max-w-full rounded-md object-contain"
                      />
                    </div>
                  ) : (
                    <Alert>Preview is not available for this document.</Alert>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4">
                <Alert>Select a document to preview it.</Alert>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
