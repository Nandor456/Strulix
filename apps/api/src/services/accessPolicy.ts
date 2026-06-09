import { Prisma } from "../../database/generated/prisma/client.js";

export const ATTENDANCE_PARTICIPANT_ROLES = ["WORKER", "LEADER"] as const;

export function isAttendanceParticipantRole(role: string): boolean {
  return ATTENDANCE_PARTICIPANT_ROLES.includes(
    role as (typeof ATTENDANCE_PARTICIPANT_ROLES)[number],
  );
}

export function attendanceParticipantRoleFilter(): Prisma.StringFilter {
  return { in: [...ATTENDANCE_PARTICIPANT_ROLES] };
}

export function workPointAssignmentWhere(userId: string): Prisma.WorkPointWhereInput {
  return {
    OR: [
      { workers: { some: { id: userId } } },
      { attendances: { some: { workerId: userId } } },
    ],
  };
}

export function companyWorkPointAccessWhere(params: {
  userId: string;
  companyId: string;
  role: string;
}): Prisma.WorkPointWhereInput {
  if (params.role === "ADMIN") {
    return { companyId: params.companyId };
  }

  if (params.role === "LEADER") {
    return {
      companyId: params.companyId,
      ...workPointAssignmentWhere(params.userId),
    };
  }

  return { id: "__forbidden__", companyId: params.companyId };
}

