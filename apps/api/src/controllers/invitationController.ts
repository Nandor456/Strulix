import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
} from "../services/invitationService.js";

export async function listInvitationsController(_req: Request, res: Response) {
  const invitations = await listInvitations();
  res.json({ invitations });
}

export async function createInvitationController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const userId = req.auth!.userId;
  const { email, role } = req.body as { email: string; role: string };
  try {
    const invitation = await createInvitation({
      email,
      role,
      invitedById: userId,
    });
    res.status(201).json({ invitation });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create invitation";
    res.status(400).json({ error: message });
  }
}

export async function revokeInvitationController(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;
  try {
    const invitation = await revokeInvitation(id);
    res.json({ invitation });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to revoke invitation";
    res.status(400).json({ error: message });
  }
}
