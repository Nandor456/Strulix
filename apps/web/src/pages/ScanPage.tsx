import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Link, useNavigate } from "react-router-dom";
import { Camera, QrCode, RotateCcw, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/hooks/useI18n";

type ScannerState =
  | { status: "starting" }
  | { status: "scanning"; message?: string }
  | { status: "error"; message: string };

const QR_TOKEN_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function extractQrToken(value: string) {
  const trimmed = value.trim();
  if (QR_TOKEN_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const checkinIndex = segments.indexOf("checkin");
    if (checkinIndex === -1) return null;
    const token = segments[checkinIndex + 1] ?? "";
    return QR_TOKEN_PATTERN.test(token) ? token : null;
  } catch {
    return null;
  }
}

function cameraErrorMessage(error: unknown, t: (key: string) => string) {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return t("Allow camera access to scan attendance.");
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return t("No camera was found on this device.");
  }
  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    return t("Camera scanning requires HTTPS.");
  }
  return t("Unable to start the camera scanner.");
}

export default function ScanPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false);
  const lastInvalidRef = useRef("");
  const [restartKey, setRestartKey] = useState(0);
  const [scannerState, setScannerState] = useState<ScannerState>({
    status: "starting",
  });

  useEffect(() => {
    let didCancel = false;
    const reader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 250,
    });
    handledRef.current = false;
    lastInvalidRef.current = "";

    async function startScanner() {
      if (!videoRef.current) return;

      try {
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: { facingMode: { ideal: "environment" } },
          },
          videoRef.current,
          (result, _error, controls) => {
            if (!result || handledRef.current) return;

            const rawValue = result.getText();
            const qrToken = extractQrToken(rawValue);
            if (!qrToken) {
              if (rawValue !== lastInvalidRef.current) {
                lastInvalidRef.current = rawValue;
                setScannerState({
                  status: "scanning",
                  message: t("Scan a Strulix attendance QR code."),
                });
              }
              return;
            }

            handledRef.current = true;
            controls.stop();
            navigate(`/checkin/${qrToken}`);
          },
        );

        if (didCancel) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setScannerState({ status: "scanning" });
      } catch (error) {
        if (!didCancel) {
          setScannerState({
            status: "error",
            message: cameraErrorMessage(error, t),
          });
        }
      }
    }

    void startScanner();

    return () => {
      didCancel = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [navigate, restartKey, t]);

  const isStarting = scannerState.status === "starting";
  const isError = scannerState.status === "error";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <XCircle className="h-4 w-4" />
            {t("Cancel")}
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h1 className="truncate text-lg font-semibold">{t("Scan attendance")}</h1>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
          <div className="aspect-square w-full max-w-72 rounded-2xl border-4 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.36)]" />
        </div>
        <div className="absolute inset-x-4 bottom-5 mx-auto max-w-sm rounded-xl border bg-background/95 p-4 text-center shadow-lg backdrop-blur">
          {isStarting ? (
            <div className="flex items-center justify-center gap-3">
              <Spinner size={20} />
              <span className="text-sm font-medium">{t("Starting camera...")}</span>
            </div>
          ) : isError ? (
            <div className="space-y-3">
              <Alert variant="destructive">{scannerState.message}</Alert>
              <Button
                className="w-full"
                onClick={() => {
                  setScannerState({ status: "starting" });
                  setRestartKey((key) => key + 1);
                }}
              >
                <RotateCcw className="h-4 w-4" />
                {t("Try again")}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <Camera className="h-4 w-4" />
                {t("Point the camera at the attendance QR code.")}
              </div>
              {scannerState.message && (
                <p className="text-sm text-destructive">{scannerState.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
