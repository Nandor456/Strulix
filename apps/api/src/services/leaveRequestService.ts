import { prisma } from "../../database/prisma.js";
import {
  LeaveRequestStatus as PrismaLeaveRequestStatus,
  LeaveRequestType as PrismaLeaveRequestType,
} from "../../database/generated/prisma/enums.js";
import { todayInZone } from "../utils/dateHelpers.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REQUESTER_ROLES = new Set(["WORKER", "LEADER"]);
const REVIEWER_ROLES = new Set(["ADMIN", "LEADER"]);

export type LeaveRequestType = "VACATION" | "SICK";
export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveRequestDTO = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveRequestStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
};

type LeaveRequestRow = {
  id: string;
  userId: string;
  type: LeaveRequestType;
  startDate: Date;
  endDate: Date;
  status: LeaveRequestStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  user: { username: string; email: string };
  reviewer: { username: string } | null;
};

type LeaveRequestErrorCode =
  | "CONFLICT"
  | "FORBIDDEN"
  | "INVALID"
  | "NOT_FOUND"
  | "OVERLAP";

function leaveRequestError(message: string, code: LeaveRequestErrorCode): Error {
  const error = new Error(message);
  (error as NodeJS.ErrnoException).code = code;
  return error;
}

export function parseLeaveDateOnly(value: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw leaveRequestError("Date must be in YYYY-MM-DD format", "INVALID");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw leaveRequestError("Date must be a valid calendar date", "INVALID");
  }

  return date;
}

export function formatLeaveDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function countInclusiveLeaveDays(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / DAY_MS) + 1;
}

export function leaveDateRangesOverlap(params: {
  firstStart: Date;
  firstEnd: Date;
  secondStart: Date;
  secondEnd: Date;
}): boolean {
  return (
    params.firstStart <= params.secondEnd &&
    params.firstEnd >= params.secondStart
  );
}

function toDTO(row: LeaveRequestRow): LeaveRequestDTO {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user.username,
    userEmail: row.user.email,
    type: row.type,
    startDate: formatLeaveDateOnly(row.startDate),
    endDate: formatLeaveDateOnly(row.endDate),
    days: countInclusiveLeaveDays(row.startDate, row.endDate),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    reviewedBy: row.reviewedBy,
    reviewedByName: row.reviewer?.username ?? null,
  };
}

function includeLeaveRequestUsers() {
  return {
    user: { select: { username: true, email: true } },
    reviewer: { select: { username: true } },
  } as const;
}

function assertValidDateRange(startDate: Date, endDate: Date): void {
  if (endDate < startDate) {
    throw leaveRequestError("End date cannot be before start date", "INVALID");
  }

  const today = todayInZone();
  if (startDate < today) {
    throw leaveRequestError("You cannot select past dates.", "INVALID");
  }
}

async function assertRequesterCanCreate(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw leaveRequestError("User not found", "NOT_FOUND");
  }

  if (!REQUESTER_ROLES.has(user.role)) {
    throw leaveRequestError("Admins cannot create leave requests", "FORBIDDEN");
  }
}

async function assertReviewerCanReview(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw leaveRequestError("User not found", "NOT_FOUND");
  }

  if (!REVIEWER_ROLES.has(user.role)) {
    throw leaveRequestError("Only admins and leaders can review requests", "FORBIDDEN");
  }
}

async function assertNoActiveOverlap(params: {
  userId: string;
  startDate: Date;
  endDate: Date;
  excludeId?: string;
}): Promise<void> {
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      userId: params.userId,
      status: {
        in: [
          PrismaLeaveRequestStatus.PENDING,
          PrismaLeaveRequestStatus.APPROVED,
        ],
      },
      startDate: { lte: params.endDate },
      endDate: { gte: params.startDate },
      ...(params.excludeId ? { NOT: { id: params.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (overlapping) {
    throw leaveRequestError(
      "This period overlaps with an existing request.",
      "OVERLAP",
    );
  }
}

export async function listAllLeaveRequests(): Promise<LeaveRequestDTO[]> {
  const rows = await prisma.leaveRequest.findMany({
    include: includeLeaveRequestUsers(),
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toDTO);
}

export async function listMyLeaveRequests(
  userId: string,
): Promise<LeaveRequestDTO[]> {
  const rows = await prisma.leaveRequest.findMany({
    where: { userId },
    include: includeLeaveRequestUsers(),
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toDTO);
}

export async function getLeaveRequestObserverUserIds(
  leaveRequestUserId: string,
): Promise<string[]> {
  const managers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "LEADER"] } },
    select: { id: true },
  });

  return Array.from(
    new Set([leaveRequestUserId, ...managers.map((manager) => manager.id)]),
  );
}

export async function createLeaveRequest(params: {
  userId: string;
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
}): Promise<LeaveRequestDTO> {
  await assertRequesterCanCreate(params.userId);

  const startDate = parseLeaveDateOnly(params.startDate);
  const endDate = parseLeaveDateOnly(params.endDate);

  assertValidDateRange(startDate, endDate);
  await assertNoActiveOverlap({
    userId: params.userId,
    startDate,
    endDate,
  });

  const row = await prisma.leaveRequest.create({
    data: {
      userId: params.userId,
      type:
        params.type === "VACATION"
          ? PrismaLeaveRequestType.VACATION
          : PrismaLeaveRequestType.SICK,
      startDate,
      endDate,
      status: PrismaLeaveRequestStatus.PENDING,
    },
    include: includeLeaveRequestUsers(),
  });

  return toDTO(row);
}

async function reviewLeaveRequest(params: {
  requestId: string;
  reviewerId: string;
  status: "APPROVED" | "REJECTED";
}): Promise<LeaveRequestDTO> {
  await assertReviewerCanReview(params.reviewerId);

  const request = await prisma.leaveRequest.findUnique({
    where: { id: params.requestId },
    include: includeLeaveRequestUsers(),
  });

  if (!request) {
    throw leaveRequestError("Leave request not found", "NOT_FOUND");
  }

  if (request.userId === params.reviewerId) {
    throw leaveRequestError("You cannot review your own leave request", "FORBIDDEN");
  }

  if (request.status !== PrismaLeaveRequestStatus.PENDING) {
    throw leaveRequestError("Only pending requests can be reviewed", "CONFLICT");
  }

  if (params.status === "APPROVED") {
    await assertNoActiveOverlap({
      userId: request.userId,
      startDate: request.startDate,
      endDate: request.endDate,
      excludeId: request.id,
    });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: request.id },
    data: {
      status:
        params.status === "APPROVED"
          ? PrismaLeaveRequestStatus.APPROVED
          : PrismaLeaveRequestStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedBy: params.reviewerId,
    },
    include: includeLeaveRequestUsers(),
  });

  return toDTO(updated);
}

export function approveLeaveRequest(params: {
  requestId: string;
  reviewerId: string;
}): Promise<LeaveRequestDTO> {
  return reviewLeaveRequest({ ...params, status: "APPROVED" });
}

export function rejectLeaveRequest(params: {
  requestId: string;
  reviewerId: string;
}): Promise<LeaveRequestDTO> {
  return reviewLeaveRequest({ ...params, status: "REJECTED" });
}

export async function cancelLeaveRequest(params: {
  requestId: string;
  userId: string;
}): Promise<LeaveRequestDTO> {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: params.requestId },
    include: includeLeaveRequestUsers(),
  });

  if (!request) {
    throw leaveRequestError("Leave request not found", "NOT_FOUND");
  }

  if (request.userId !== params.userId) {
    throw leaveRequestError("You can only cancel your own requests", "FORBIDDEN");
  }

  if (request.status !== PrismaLeaveRequestStatus.PENDING) {
    throw leaveRequestError("Only pending requests can be canceled", "CONFLICT");
  }

  const deleted = await prisma.leaveRequest.delete({
    where: { id: request.id },
    include: includeLeaveRequestUsers(),
  });

  return toDTO(deleted);
}
