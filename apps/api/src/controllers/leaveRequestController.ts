import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  getLeaveRequestObserverUserIds,
  listAllLeaveRequests,
  listMyLeaveRequests,
  rejectLeaveRequest,
  type LeaveRequestDTO,
  type LeaveRequestType,
} from "../services/leaveRequestService.js";
import { emitLeaveRequestChanged } from "../realtime/socketServer.js";

type LeaveRequestRealtimeAction =
  | "created"
  | "approved"
  | "rejected"
  | "canceled";

function notifyLeaveRequestChanged(
  action: LeaveRequestRealtimeAction,
  leaveRequest: LeaveRequestDTO,
) {
  void (async () => {
    try {
      const userIds = await getLeaveRequestObserverUserIds(leaveRequest.userId);
      emitLeaveRequestChanged(
        {
          action,
          leaveRequest,
          changedAt: new Date().toISOString(),
        },
        userIds,
      );
    } catch (error) {
      console.error("notifyLeaveRequestChanged error:", error);
    }
  })();
}

function statusForLeaveRequestError(error: unknown): number {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return 500;
  }

  switch ((error as { code: string }).code) {
    case "INVALID":
      return 400;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
    case "OVERLAP":
      return 409;
    default:
      return 500;
  }
}

function sendLeaveRequestError(res: Response, error: unknown): void {
  const status = statusForLeaveRequestError(error);
  const message =
    error instanceof Error ? error.message : "Failed to process leave request";
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : message,
  });
}

export async function listAllLeaveRequestsController(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const leaveRequests = await listAllLeaveRequests();
    res.json({ leaveRequests });
  } catch (error) {
    console.error("listAllLeaveRequestsController error:", error);
    sendLeaveRequestError(res, error);
  }
}

export async function listMyLeaveRequestsController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const leaveRequests = await listMyLeaveRequests(req.auth!.userId);
    res.json({ leaveRequests });
  } catch (error) {
    console.error("listMyLeaveRequestsController error:", error);
    sendLeaveRequestError(res, error);
  }
}

export async function createLeaveRequestController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const body = req.body as {
    type: LeaveRequestType;
    startDate: string;
    endDate: string;
  };

  try {
    const leaveRequest = await createLeaveRequest({
      userId: req.auth!.userId,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
    });
    notifyLeaveRequestChanged("created", leaveRequest);
    res.status(201).json({ leaveRequest });
  } catch (error) {
    sendLeaveRequestError(res, error);
  }
}

export async function approveLeaveRequestController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const leaveRequest = await approveLeaveRequest({
      requestId: req.params.id,
      reviewerId: req.auth!.userId,
    });
    notifyLeaveRequestChanged("approved", leaveRequest);
    res.json({ leaveRequest });
  } catch (error) {
    sendLeaveRequestError(res, error);
  }
}

export async function rejectLeaveRequestController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const leaveRequest = await rejectLeaveRequest({
      requestId: req.params.id,
      reviewerId: req.auth!.userId,
    });
    notifyLeaveRequestChanged("rejected", leaveRequest);
    res.json({ leaveRequest });
  } catch (error) {
    sendLeaveRequestError(res, error);
  }
}

export async function cancelLeaveRequestController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const leaveRequest = await cancelLeaveRequest({
      requestId: req.params.id,
      userId: req.auth!.userId,
    });
    notifyLeaveRequestChanged("canceled", leaveRequest);
    res.json({ leaveRequest });
  } catch (error) {
    sendLeaveRequestError(res, error);
  }
}
