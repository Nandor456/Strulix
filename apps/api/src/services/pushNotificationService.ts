import type { MessagePayload } from "./messagingService.js";
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

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: message.senderUsername,
      body: previewForMessage(message),
    },
    data: {
      type: "message",
      chatId: message.chatId,
      messageId: message.id,
    },
    android: {
      priority: "high",
      notification: {
        channelId: "buildpulse_messages",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  });

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
