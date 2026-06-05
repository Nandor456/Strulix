import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  SubcontractorAccessError,
  acceptSubcontractorInvitation,
  createOrRenewSubcontractorInvitation,
  listIncomingSubcontractorAccess,
  listOutgoingSubcontractorAccess,
  revokeSubcontractorAccess,
} from "../services/subcontractorService.js";

function statusForError(error: unknown) {
  if (error instanceof SubcontractorAccessError) return error.statusCode;
  return 500;
}

function messageForError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function listOutgoingSubcontractorsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const subcontractors = await listOutgoingSubcontractorAccess(
      req.auth!.companyId,
    );
    res.json({ subcontractors });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to list subcontractors"),
    });
  }
}

export async function createSubcontractorInvitationController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { invitedAdminEmail } = req.body as { invitedAdminEmail: string };

  try {
    const subcontractor = await createOrRenewSubcontractorInvitation({
      invitedAdminEmail,
      invitedById: req.auth!.userId,
      ownerCompanyId: req.auth!.companyId,
    });
    res.status(201).json({ subcontractor });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to invite subcontractor"),
    });
  }
}

export async function listIncomingSubcontractorsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const subcontractors = await listIncomingSubcontractorAccess(
      req.auth!.companyId,
    );
    res.json({ subcontractors });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to list incoming invitations"),
    });
  }
}

export async function acceptSubcontractorInvitationController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { token } = req.body as { token: string };

  try {
    const subcontractor = await acceptSubcontractorInvitation({
      token,
      acceptedById: req.auth!.userId,
      companyId: req.auth!.companyId,
      role: req.auth!.role,
    });
    res.json({ subcontractor });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to accept subcontractor invitation"),
    });
  }
}

export async function revokeSubcontractorAccessController(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
) {
  try {
    const subcontractor = await revokeSubcontractorAccess({
      id: req.params.id,
      ownerCompanyId: req.auth!.companyId,
    });
    res.json({ subcontractor });
  } catch (error) {
    res.status(statusForError(error)).json({
      error: messageForError(error, "Failed to revoke subcontractor access"),
    });
  }
}
