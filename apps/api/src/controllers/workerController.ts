import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import { prisma } from "../../database/prisma.js";
import {
  assignWorkerToWorkPoint,
  deleteWorker,
  listWorkers,
  listWorkersForWorkPoint,
  removeWorkerFromWorkPoint,
  updateWorker,
} from "../services/workerService.js";
import { getWorkPointChatId } from "../services/messagingService.js";
import { emitChatChanged } from "../realtime/socketServer.js";

function notifyWorkPointChatChanged(workPointId: string, extraUserIds: string[] = []) {
  void (async () => {
    try {
      const chatId = await getWorkPointChatId(workPointId);
      if (chatId) await emitChatChanged(chatId, extraUserIds);
    } catch (error) {
      console.error("notifyWorkPointChatChanged error:", error);
    }
  })();
}

async function ensureWorkPointExists(workPointId: string) {
  return prisma.workPoint.findUnique({
    where: { id: workPointId },
    select: { id: true },
  });
}

export async function listWorkersController(
  _req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workers = await listWorkers();
    res.json({ workers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list workers";
    res.status(500).json({ error: message });
  }
}

export async function listWorkPointWorkersController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;

  try {
    const workPoint = await ensureWorkPointExists(id);
    if (!workPoint) {
      return res.status(404).json({ error: "Work point not found" });
    }

    const workers = await listWorkersForWorkPoint(id);
    res.json({ workers });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to list workers for work point";
    res.status(500).json({ error: message });
  }
}

export async function assignWorkerController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;
  const { workerId } = req.body as { workerId?: string };

  if (!workerId) {
    return res.status(400).json({ error: "workerId is required" });
  }

  try {
    const workPoint = await ensureWorkPointExists(id);
    if (!workPoint) {
      return res.status(404).json({ error: "Work point not found" });
    }

    await assignWorkerToWorkPoint(id, workerId, req.auth!.userId);
    notifyWorkPointChatChanged(id);
    const workers = await listWorkersForWorkPoint(id);
    res.status(200).json({ workers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to assign worker";
    res.status(400).json({ error: message });
  }
}

export async function removeWorkerController(
  req: AuthenticatedRequest<{ id: string; workerId: string }>,
  res: Response,
) {
  const { id, workerId } = req.params;

  try {
    const workPoint = await ensureWorkPointExists(id);
    if (!workPoint) {
      return res.status(404).json({ error: "Work point not found" });
    }

    await removeWorkerFromWorkPoint(id, workerId);
    notifyWorkPointChatChanged(id, [workerId]);
    const workers = await listWorkersForWorkPoint(id);
    res.status(200).json({ workers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove worker";
    res.status(400).json({ error: message });
  }
}

export async function updateWorkerController(
  req: AuthenticatedRequest<{ workerId: string }>,
  res: Response,
) {
  const { workerId } = req.params;
  const { username, email, role, hourlyWage } = req.body as {
    username?: string;
    email?: string;
    role?: string;
    hourlyWage?: number | null;
  };

  try {
    const worker = await updateWorker(workerId, { username, email, role, hourlyWage });
    res.json({ worker });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update worker";
    res.status(400).json({ error: message });
  }
}

export async function deleteWorkerController(
  req: AuthenticatedRequest<{ workerId: string }>,
  res: Response,
) {
  const { workerId } = req.params;

  try {
    await deleteWorker(workerId);
    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete worker";
    res.status(400).json({ error: message });
  }
}
