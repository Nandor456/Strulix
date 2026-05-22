import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, Navigate, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, Clock, LogIn, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatDateTime, formatHours, formatMoney } from "@/lib/format";
import { attendanceAPI, type ScanResult } from "@/services/api/attendanceApi";

const inFlightScans = new Map<string, Promise<ScanResult>>();

type ScanState =
  | { status: "pending" }
  | { status: "success"; result: ScanResult }
  | { status: "error"; error: unknown };

function scanQrToken(qrToken: string) {
  const existing = inFlightScans.get(qrToken);
  if (existing) return existing;

  const request = attendanceAPI.checkin(qrToken).finally(() => {
    if (inFlightScans.get(qrToken) === request) {
      inFlightScans.delete(qrToken);
    }
  });

  inFlightScans.set(qrToken, request);
  return request;
}

function getErrorMessage(error: unknown) {
  return (
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    "Unable to record attendance."
  );
}

export default function CheckinPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const location = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [scanState, setScanState] = useState<ScanState>({ status: "pending" });
  const latestScanIdRef = useRef(0);

  const startScan = useCallback((token: string) => {
    const scanId = latestScanIdRef.current + 1;
    latestScanIdRef.current = scanId;
    setScanState({ status: "pending" });

    void scanQrToken(token)
      .then((result) => {
        if (latestScanIdRef.current === scanId) {
          setScanState({ status: "success", result });
        }
      })
      .catch((error: unknown) => {
        if (latestScanIdRef.current === scanId) {
          setScanState({ status: "error", error });
        }
      });
  }, []);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !qrToken) return;

    const timeoutId = window.setTimeout(() => startScan(qrToken), 0);
    return () => window.clearTimeout(timeoutId);
  }, [isAuthLoading, isAuthenticated, qrToken, startScan]);

  if (!isAuthLoading && !isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!qrToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <Alert variant="destructive" className="max-w-sm">
          Invalid QR code.
        </Alert>
      </main>
    );
  }

  const result = scanState.status === "success" ? scanState.result : null;
  const completedResult = result && result.event !== "CHECK_IN" ? result : null;
  const isPending = scanState.status === "pending" || isAuthLoading;
  const isError = scanState.status === "error";
  const resultAlertClassName =
    result?.event === "CHECK_IN"
      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
      : result?.event === "ALREADY_COMPLETED"
        ? "border-amber-500/30 text-amber-700 dark:text-amber-300"
        : undefined;
  const resultLabel =
    result?.event === "CHECK_IN"
      ? "Checked in"
      : result?.event === "CHECK_OUT"
        ? "Checked out"
        : "Already completed today";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isError ? (
              <XCircle className="h-7 w-7" />
            ) : result ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (
              <Clock className="h-7 w-7" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold">Attendance scan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPending
                ? "Recording attendance..."
                : result
                  ? result.workPointName
                  : "Preparing scan"}
            </p>
          </div>
        </div>

        {isPending && (
          <div className="flex justify-center py-8">
            <Spinner size={36} />
          </div>
        )}

        {isError && (
          <div className="space-y-4">
            <Alert variant="destructive">{getErrorMessage(scanState.error)}</Alert>
            <Button
              className="w-full"
              onClick={() => {
                if (!qrToken) return;
                startScan(qrToken);
              }}
            >
              <LogIn className="h-4 w-4" />
              Try again
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <Alert className={resultAlertClassName}>{resultLabel}</Alert>
            {result.event === "ALREADY_COMPLETED" && (
              <Alert>
                This attendance was already completed for today.
              </Alert>
            )}
            {completedResult?.checkoutSource === "AUTO" && (
              <Alert variant="destructive">
                This attendance was automatically closed at 22:00 and may need
                review.
              </Alert>
            )}
            <div className="rounded-md border">
              <div className="grid grid-cols-2 gap-3 border-b px-4 py-3 text-sm">
                <span className="text-muted-foreground">Workpoint</span>
                <span className="text-right font-medium">{result.workPointName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 border-b px-4 py-3 text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-right font-medium">{formatDate(result.date)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Checked in</span>
                <span className="text-right font-medium">
                  {formatDateTime(result.checkedInAt)}
                </span>
              </div>
            </div>
            {completedResult && (
              <div className="rounded-md border">
                <div className="grid grid-cols-2 gap-3 border-b px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Checked out</span>
                  <span className="text-right font-medium">
                    {formatDateTime(completedResult.checkedOutAt)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 border-b px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Hours</span>
                  <span className="text-right font-medium">
                    {formatHours(completedResult.hours)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Earnings</span>
                  <span className="text-right font-medium">
                    {formatMoney(completedResult.earnings)}
                  </span>
                </div>
              </div>
            )}
            <Button asChild className="w-full">
              <RouterLink to="/messages">Done</RouterLink>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
