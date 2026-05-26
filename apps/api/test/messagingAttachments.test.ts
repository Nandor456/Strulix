import assert from "node:assert/strict";
import test from "node:test";
import { sendMessageSchema } from "../src/schemas/messagingSchemas.js";
import { createMessage } from "../src/services/messagingService.js";
import { normalizeMessageAttachmentUrl } from "../src/utils/messagingAttachments.js";

const chatId = "11111111-1111-4111-8111-111111111111";

function messagePayload(attachmentUrl: string | undefined) {
  return {
    params: { chatId },
    query: {},
    body: {
      body: "",
      ...(attachmentUrl === undefined ? {} : { attachmentUrl }),
    },
  };
}

test("REST message validation accepts only messaging upload attachment URLs", () => {
  assert.equal(
    sendMessageSchema.safeParse(
      messagePayload("/uploads/messaging/attachment-1.pdf"),
    ).success,
    true,
  );

  for (const attachmentUrl of [
    "?",
    "/?",
    "/",
    "/api/uploads/messaging/attachment-1.pdf",
    "https://api.example.com/uploads/messaging/attachment-1.pdf",
  ]) {
    assert.equal(
      sendMessageSchema.safeParse(messagePayload(attachmentUrl)).success,
      false,
      attachmentUrl,
    );
  }
});

test("socket message creation rejects invalid attachment URLs before database access", async () => {
  await assert.rejects(
    () =>
      createMessage("chat-id", "sender-id", "", {
        attachmentUrl: "/?",
      }),
    /Invalid message attachment URL/,
  );
});

test("message attachment URL normalization trims valid uploads", () => {
  assert.equal(
    normalizeMessageAttachmentUrl(" /uploads/messaging/attachment-1.pdf "),
    "/uploads/messaging/attachment-1.pdf",
  );
  assert.equal(normalizeMessageAttachmentUrl(undefined), undefined);
  assert.equal(normalizeMessageAttachmentUrl(" "), undefined);
});
