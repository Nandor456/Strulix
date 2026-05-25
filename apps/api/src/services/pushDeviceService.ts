import { prisma } from "../../database/prisma.js";

export type PushPlatform = "ios" | "android";

export async function upsertPushDevice(params: {
  userId: string;
  token: string;
  platform: PushPlatform;
}) {
  const now = new Date();
  return prisma.pushDevice.upsert({
    where: { token: params.token },
    create: {
      userId: params.userId,
      token: params.token,
      platform: params.platform,
      lastSeenAt: now,
    },
    update: {
      userId: params.userId,
      platform: params.platform,
      lastSeenAt: now,
    },
  });
}

export async function deletePushDeviceForUser(userId: string, token: string) {
  await prisma.pushDevice.deleteMany({
    where: { userId, token },
  });
}

export async function deletePushDevicesByTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  await prisma.pushDevice.deleteMany({
    where: { token: { in: tokens } },
  });
}

export async function listPushDevicesForUsers(userIds: string[]) {
  if (userIds.length === 0) return [];
  return prisma.pushDevice.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });
}
