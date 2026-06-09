import type { MessagePayload } from "./messagingService.js";
import type { AttendanceLocationAlertDTO } from "./attendanceLocationService.js";
import { prisma } from "../../database/prisma.js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { Messaging } from "firebase-admin/messaging";
import {
  deletePushDevicesByTokens,
  listPushDevicesForUsers,
} from "./pushDeviceService.js";

const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

let firebaseMessaging: Messaging | null | undefined;
let warnedMissingFirebaseConfig = false;

function maskToken(token: string) {
  if (token.length <= 12) return token;
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

function getFirebaseMessaging(): Messaging | null {
  if (firebaseMessaging !== undefined) return firebaseMessaging;

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!rawServiceAccount) {
    if (!warnedMissingFirebaseConfig && process.env.NODE_ENV === "production") {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Push notifications are disabled.",
      );
      warnedMissingFirebaseConfig = true;
    }
    firebaseMessaging = null;
    return firebaseMessaging;
  }

  try {
    const serviceAccount = JSON.parse(rawServiceAccount);
    if (getApps().length === 0) {
      initializeApp({ credential: cert(serviceAccount) });
      console.info(
        `[push] Firebase Admin initialized for project ${serviceAccount.project_id ?? "<unknown>"}.`,
      );
    }
    firebaseMessaging = getMessaging();
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    firebaseMessaging = null;
  }

  return firebaseMessaging;
}

function previewForMessage(message: MessagePayload) {
  const body = message.body.trim();
  if (body.length > 0) return body.length > 140 ? `${body.slice(0, 137)}...` : body;
  if (message.attachmentName) return "sent an attachment";
  return "sent a message";
}

function alertTypeLabel(type: string) {
  if (type === "OUT_OF_RADIUS") return "Worker outside workpoint radius";
  if (type === "MISSED_CHECK") return "Hourly location check missed";
  return "Attendance monitoring unavailable";
}

async function sendMulticastAndPruneInvalidTokens(params: {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
  threadId: string;
}) {
  const messaging = getFirebaseMessaging();
  if (!messaging || params.tokens.length === 0) return;

  const response = await messaging.sendEachForMulticast({
    tokens: params.tokens,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: params.data,
    android: {
      priority: "high",
      notification: {
        title: params.title,
        body: params.body,
        channelId: "buildpulse_messages",
        priority: "high",
        sound: "default",
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
        "apns-push-type": "alert",
      },
      payload: {
        aps: {
          alert: {
            title: params.title,
            body: params.body,
          },
          sound: "default",
          threadId: params.threadId,
        },
      },
    },
  });

  if (response.failureCount > 0) {
    console.warn(
      `[push] ${response.failureCount}/${params.tokens.length} notifications failed.`,
    );
    response.responses.forEach((result, index) => {
      if (result.success) return;
      const errorCode = result.error?.code ?? "<unknown>";
      const errorMessage = result.error?.message ?? "Unknown Firebase error";
      console.warn(
        `[push] delivery failure token=${maskToken(params.tokens[index] ?? "")} code=${errorCode} message=${errorMessage}`,
      );
    });
  }

  const invalidTokens = response.responses
    .map((result, index) =>
      !result.success &&
      result.error?.code &&
      INVALID_TOKEN_ERROR_CODES.has(result.error.code)
        ? params.tokens[index]
        : null,
    )
    .filter((token): token is string => Boolean(token));

  await deletePushDevicesByTokens(invalidTokens);
}

export async function notifyMessageRecipients(message: MessagePayload) {
  const messaging = getFirebaseMessaging();
  if (!messaging) return;

  const participants = await prisma.chatParticipant.findMany({
    where: {
      chatId: message.chatId,
      userId: { not: message.senderId },
    },
    select: { userId: true },
  });
  const recipientIds = participants.map((participant) => participant.userId);
  const devices = await listPushDevicesForUsers(recipientIds);
  const tokens = [...new Set(devices.map((device) => device.token))];
  if (tokens.length === 0) return;

  const title = message.senderUsername;
  const body = previewForMessage(message);
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      type: "message",
      chatId: message.chatId,
      messageId: message.id,
    },
    android: {
      priority: "high",
      notification: {
        title,
        body,
        channelId: "buildpulse_messages",
        priority: "high",
        sound: "default",
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
        "apns-push-type": "alert",
      },
      payload: {
        aps: {
          alert: {
            title,
            body,
          },
          sound: "default",
          threadId: message.chatId,
        },
      },
    },
  });

  if (response.failureCount > 0) {
    console.warn(
      `[push] ${response.failureCount}/${tokens.length} message notifications failed.`,
    );
    response.responses.forEach((result, index) => {
      if (result.success) return;
      const errorCode = result.error?.code ?? "<unknown>";
      const errorMessage = result.error?.message ?? "Unknown Firebase error";
      console.warn(
        `[push] delivery failure token=${maskToken(tokens[index] ?? "")} code=${errorCode} message=${errorMessage}`,
      );
    });
  }

  const invalidTokens = response.responses
    .map((result, index) =>
      !result.success &&
      result.error?.code &&
      INVALID_TOKEN_ERROR_CODES.has(result.error.code)
        ? tokens[index]
        : null,
    )
    .filter((token): token is string => Boolean(token));

  await deletePushDevicesByTokens(invalidTokens);
}

export async function notifyAttendanceLocationAlertRecipients(params: {
  alert: AttendanceLocationAlertDTO;
  recipientIds: string[];
}) {
  const devices = await listPushDevicesForUsers(params.recipientIds);
  const tokens = [...new Set(devices.map((device) => device.token))];
  if (tokens.length === 0) return;

  const title = "Attendance alert";
  const body = `${params.alert.worker.username} - ${alertTypeLabel(params.alert.type)}`;
  await sendMulticastAndPruneInvalidTokens({
    tokens,
    title,
    body,
    data: {
      type: "attendance_location_alert",
      alertId: params.alert.id,
      workPointId: params.alert.workPointId,
      attendanceId: params.alert.attendanceId,
      workerId: params.alert.workerId,
    },
    threadId: params.alert.workPointId,
  });
}
