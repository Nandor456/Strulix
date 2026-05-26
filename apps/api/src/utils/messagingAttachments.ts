export const MESSAGE_ATTACHMENT_URL_PATTERN = /^\/uploads\/messaging\/[^?#]+$/;

export function normalizeMessageAttachmentUrl(
  attachmentUrl: string | undefined,
) {
  const trimmed = attachmentUrl?.trim();
  if (!trimmed) return undefined;
  if (!MESSAGE_ATTACHMENT_URL_PATTERN.test(trimmed)) {
    throw new Error("Invalid message attachment URL");
  }
  return trimmed;
}
