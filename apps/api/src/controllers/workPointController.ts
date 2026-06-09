import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  createWorkPoint,
  deleteWorkPoint,
  getWorkPointById,
  listMyAssignedWorkPoints,
  listWorkPoints,
  updateWorkPoint,
  type UpdateWorkPointInput,
  type WorkPointInput,
} from "../services/workPointService.js";
import { getWorkPointChatId } from "../services/messagingService.js";
import { emitChatChanged } from "../realtime/socketServer.js";

function statusForError(error: unknown) {
  if (!(error instanceof Error)) return 500;
  if (error.message === "Work point not found") return 404;
  return 400;
}

function messageForError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function notifyWorkPointChatChanged(workPointId: string) {
  void (async () => {
    try {
      const chatId = await getWorkPointChatId(workPointId);
      if (chatId) await emitChatChanged(chatId);
    } catch (error) {
      console.error("notifyWorkPointChatChanged error:", error);
    }
  })();
}

export async function listWorkPointsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workPoints = await listWorkPoints({
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
    });
    res.json({ workPoints });
  } catch (error) {
    res.status(500).json({
      error: messageForError(error, "Failed to list work points"),
    });
  }
}

export async function listMyAssignedWorkPointsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workPoints = await listMyAssignedWorkPoints(
      req.auth!.userId,
      req.auth!.companyId,
    );
    res.json({ workPoints });
  } catch (error) {
    res.status(500).json({
      error: messageForError(error, "Failed to list assigned work points"),
    });
  }
}

export async function getWorkPointController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;

  try {
    const workPoint = await getWorkPointById(id, {
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
    });
    if (!workPoint) {
      return res.status(404).json({ error: "Work point not found" });
    }

    res.json({ workPoint });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to load work point"),
    });
  }
}

export async function createWorkPointController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workPoint = await createWorkPoint(
      req.body as WorkPointInput,
      req.auth!.userId,
      req.auth!.companyId,
      req.auth!.role,
    );
    notifyWorkPointChatChanged(workPoint.id);
    res.status(201).json({ workPoint });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to create work point"),
    });
  }
}

export async function updateWorkPointController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;

  try {
    const workPoint = await updateWorkPoint(
      id,
      {
        userId: req.auth!.userId,
        companyId: req.auth!.companyId,
        role: req.auth!.role,
      },
      req.body as UpdateWorkPointInput,
    );
    res.json({ workPoint });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to update work point"),
    });
  }
}

export async function deleteWorkPointController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;

  try {
    await deleteWorkPoint(id, {
      userId: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
    });
    res.status(204).send();
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to delete work point"),
    });
  }
}
