import { prisma } from "../../database/prisma.js";
import axios from "axios";
import {
  addParticipantToChat,
  getOrCreateWorkPointChat,
  removeParticipantFromChat,
} from "./messagingService.js";
import {
  listWorkPointDocumentStoredNames,
  removeWorkPointDocumentFiles,
} from "./workPointDocumentService.js";
import {
  affiliationForCompany,
  type WorkerAffiliation,
} from "./subcontractorService.js";
import {
  attendanceParticipantRoleFilter,
  companyWorkPointAccessWhere,
  workPointAssignmentWhere,
} from "./accessPolicy.js";

type PublicUserSummary = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type CompanySummary = {
  id: string;
  name: string;
};

type WorkPointWorkerSummary = PublicUserSummary & {
  hourlyWage: number | null;
  company: CompanySummary;
  affiliation: WorkerAffiliation;
};

type SelectedWorkPointSummary = {
  id: string;
  companyId: string;
  company: CompanySummary;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string | null;
  userId: string | null;
  uploadedAt: Date;
  deadline: Date | null;
  user: PublicUserSummary | null;
  _count: {
    workers: number;
    attendances: number;
  };
  workers: Array<{ companyId: string }>;
};

type Coords = {
  lat: number;
  lng: number;
};

type SelectedWorkPointDetail = Omit<SelectedWorkPointSummary, "workers"> & {
  workers: Array<PublicUserSummary & {
    companyId: string;
    company: CompanySummary;
    hourlyWage: number | null;
  }>;
};

type SelectedAssignedWorkPointSummary = {
  id: string;
  companyId: string;
  company: CompanySummary;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string | null;
  userId: string | null;
  uploadedAt: Date;
  deadline: Date | null;
  user: PublicUserSummary | null;
};

export type WorkPointInput = {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  description?: string | null;
  deadline?: string | null;
};

export type UpdateWorkPointInput = Partial<WorkPointInput>;

export type WorkPointSummary = {
  id: string;
  company: CompanySummary;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string | null;
  userId: string | null;
  uploadedAt: string;
  deadline: string | null;
  owner: PublicUserSummary | null;
  workerCount: number;
  ownWorkerCount: number;
  subcontractorWorkerCount: number;
  attendanceCount: number;
};

export type AssignedWorkPointSummary = Omit<
  WorkPointSummary,
  "workerCount" | "ownWorkerCount" | "subcontractorWorkerCount" | "attendanceCount"
> & {
  affiliation: WorkerAffiliation;
};

export type WorkPointDetail = WorkPointSummary & {
  workers: WorkPointWorkerSummary[];
};

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
} as const;

const workPointSummarySelect = {
  id: true,
  companyId: true,
  company: { select: { id: true, name: true } },
  name: true,
  address: true,
  lat: true,
  lng: true,
  description: true,
  userId: true,
  uploadedAt: true,
  deadline: true,
  user: { select: publicUserSelect },
  _count: { select: { workers: true, attendances: true } },
  workers: { select: { companyId: true } },
} as const;

const workPointDetailSelect = {
  ...workPointSummarySelect,
  workers: {
    where: { role: attendanceParticipantRoleFilter() },
    select: {
      ...publicUserSelect,
      companyId: true,
      company: { select: { id: true, name: true } },
      hourlyWage: true,
    },
    orderBy: { username: "asc" },
  },
} as const;

const assignedWorkPointSelect = {
  id: true,
  companyId: true,
  company: { select: { id: true, name: true } },
  name: true,
  address: true,
  lat: true,
  lng: true,
  description: true,
  userId: true,
  uploadedAt: true,
  deadline: true,
  user: { select: publicUserSelect },
} as const;

function countWorkersByAffiliation(workPoint: SelectedWorkPointSummary) {
  const ownWorkerCount = workPoint.workers.filter(
    (worker) => worker.companyId === workPoint.companyId,
  ).length;
  return {
    ownWorkerCount,
    subcontractorWorkerCount: workPoint.workers.length - ownWorkerCount,
  };
}

function toSummary(workPoint: SelectedWorkPointSummary): WorkPointSummary {
  const counts = countWorkersByAffiliation(workPoint);
  return {
    id: workPoint.id,
    company: workPoint.company,
    name: workPoint.name,
    address: workPoint.address,
    lat: workPoint.lat,
    lng: workPoint.lng,
    description: workPoint.description,
    userId: workPoint.userId,
    uploadedAt: workPoint.uploadedAt.toISOString(),
    deadline: workPoint.deadline?.toISOString() ?? null,
    owner: workPoint.user,
    workerCount: workPoint._count.workers,
    ownWorkerCount: counts.ownWorkerCount,
    subcontractorWorkerCount: counts.subcontractorWorkerCount,
    attendanceCount: workPoint._count.attendances,
  };
}

function toDetail(workPoint: SelectedWorkPointDetail): WorkPointDetail {
  return {
    ...toSummary(workPoint),
    workers: workPoint.workers.map((worker) => {
      const affiliation = affiliationForCompany({
        ownerCompanyId: workPoint.companyId,
        workerCompanyId: worker.companyId,
      });
      return {
        id: worker.id,
        username: worker.username,
        email: worker.email,
        role: worker.role,
        company: worker.company,
        affiliation,
        hourlyWage: affiliation === "OWN_COMPANY" ? worker.hourlyWage : null,
      };
    }),
  };
}

function toAssignedSummary(
  workPoint: SelectedAssignedWorkPointSummary,
  userCompanyId: string,
): AssignedWorkPointSummary {
  return {
    id: workPoint.id,
    company: workPoint.company,
    name: workPoint.name,
    address: workPoint.address,
    lat: workPoint.lat,
    lng: workPoint.lng,
    description: workPoint.description,
    userId: workPoint.userId,
    uploadedAt: workPoint.uploadedAt.toISOString(),
    deadline: workPoint.deadline?.toISOString() ?? null,
    owner: workPoint.user,
    affiliation: affiliationForCompany({
      ownerCompanyId: workPoint.companyId,
      workerCompanyId: userCompanyId,
    }),
  };
}

function parseDeadline(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

export function parseAddressCoordinates(address: string): Coords | null {
  const match = address.match(
    /^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*$/,
  );
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

async function ensureWorkPointExists(params: {
  id: string;
  userId: string;
  companyId: string;
  role: string;
}) {
  const workPoint = await prisma.workPoint.findFirst({
    where: {
      id: params.id,
      ...companyWorkPointAccessWhere(params),
    },
    select: { id: true },
  });

  if (!workPoint) {
    throw new Error("Work point not found");
  }
}

async function syncOwnerChatParticipant(workPointId: string, ownerId?: string) {
  if (!ownerId) return;

  const chatId = await getOrCreateWorkPointChat(workPointId);
  await addParticipantToChat(chatId, ownerId);
}

export async function listWorkPoints(params: {
  userId: string;
  companyId: string;
  role: string;
}): Promise<WorkPointSummary[]> {
  const workPoints = await prisma.workPoint.findMany({
    where: companyWorkPointAccessWhere(params),
    select: workPointSummarySelect,
    orderBy: [{ uploadedAt: "desc" }],
  });

  return workPoints.map(toSummary);
}

export async function listMyAssignedWorkPoints(
  userId: string,
  companyId: string,
): Promise<AssignedWorkPointSummary[]> {
  const workPoints = await prisma.workPoint.findMany({
    where: workPointAssignmentWhere(userId),
    select: assignedWorkPointSelect,
    orderBy: [{ uploadedAt: "desc" }],
  });

  return workPoints.map((workPoint) => toAssignedSummary(workPoint, companyId));
}

export async function getWorkPointById(
  id: string,
  params: {
    userId: string;
    companyId: string;
    role: string;
  },
): Promise<WorkPointDetail | null> {
  const workPoint = await prisma.workPoint.findFirst({
    where: {
      id,
      ...companyWorkPointAccessWhere(params),
    },
    select: workPointDetailSelect,
  });

  return workPoint ? toDetail(workPoint) : null;
}

export async function createWorkPoint(
  input: WorkPointInput,
  ownerId?: string,
  companyId?: string,
  ownerRole?: string,
): Promise<WorkPointDetail> {
  if (!companyId) {
    throw new Error("Company is required");
  }
  const coords = await resolveAddressCoordinates(input.address);

  const workPoint = await prisma.workPoint.create({
    data: {
      companyId,
      name: input.name,
      address: input.address,
      lat: coords?.lat ?? input.lat ?? null,
      lng: coords?.lng ?? input.lng ?? null,
      description: input.description ?? null,
      deadline: parseDeadline(input.deadline) ?? null,
      userId: ownerId,
      ...(ownerId && ownerRole === "LEADER"
        ? { workers: { connect: { id: ownerId } } }
        : {}),
    },
    select: { id: true },
  });

  await syncOwnerChatParticipant(workPoint.id, ownerId);

  const created = await getWorkPointById(workPoint.id, {
    userId: ownerId ?? "",
    companyId,
    role: ownerRole ?? "ADMIN",
  });
  if (!created) {
    throw new Error("Work point not found");
  }

  return created;
}

export async function updateWorkPoint(
  id: string,
  params: {
    userId: string;
    companyId: string;
    role: string;
  },
  input: UpdateWorkPointInput,
): Promise<WorkPointDetail> {
  await ensureWorkPointExists({ id, ...params });
  const nextCoords = input.address !== undefined
    ? await resolveAddressCoordinates(input.address)
    : undefined;

  const data: {
    name?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
    description?: string | null;
    deadline?: Date | null;
  } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.address !== undefined) {
    data.address = input.address;
    data.lat = nextCoords?.lat ?? input.lat ?? null;
    data.lng = nextCoords?.lng ?? input.lng ?? null;
  } else {
    if (input.lat !== undefined) data.lat = input.lat;
    if (input.lng !== undefined) data.lng = input.lng;
  }
  if (input.description !== undefined) data.description = input.description;
  if (input.deadline !== undefined) data.deadline = parseDeadline(input.deadline);

  if (Object.keys(data).length > 0) {
    await prisma.workPoint.update({
      where: { id },
      data,
    });
  }

  const updated = await getWorkPointById(id, params);
  if (!updated) {
    throw new Error("Work point not found");
  }

  return updated;
}

export async function deleteWorkPoint(
  id: string,
  params: {
    userId: string;
    companyId: string;
    role: string;
  },
): Promise<void> {
  await ensureWorkPointExists({ id, ...params });
  const documentStoredNames = await listWorkPointDocumentStoredNames(id);

  const chat = await prisma.chat.findUnique({
    where: { workPointId: id },
    select: {
      id: true,
      participants: { select: { userId: true } },
    },
  });

  if (chat) {
    await Promise.all(
      chat.participants.map((participant) =>
        removeParticipantFromChat(chat.id, participant.userId),
      ),
    );
  }

  await prisma.workPoint.delete({ where: { id } });
  await removeWorkPointDocumentFiles(documentStoredNames);
}



async function nominatimQuery(
  params: Record<string, string>,
): Promise<Coords | null> {
  const url = "https://nominatim.openstreetmap.org/search";
  const { data } = await axios.get(url, {
    params: { ...params, format: "json", limit: 1, countrycodes: "ro" },
    headers: { "User-Agent": "construction-erp/1.0" },
  });
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Parses "Street Nr, PostalCode City" into components.
// Works for Romanian address formats like "Bulevardul Lacu Rosu 16, 535500 Gheorgheni"
function parseRomanianAddress(address: string): {
  street: string;
  postalCode: string | null;
  city: string | null;
} {
  // Split on the first comma
  const commaIdx = address.indexOf(",");
  const street = commaIdx !== -1 ? address.slice(0, commaIdx).trim() : address.trim();
  const rest = commaIdx !== -1 ? address.slice(commaIdx + 1).trim() : "";

  // Romanian postal codes are 6 digits
  const postalMatch = rest.match(/^(\d{6})\s+(.+)$/);
  if (postalMatch) {
    return { street, postalCode: postalMatch[1], city: postalMatch[2].trim() };
  }

  // No postal code — treat rest as city
  return { street, postalCode: null, city: rest || null };
}

async function geocodeAddress(address: string): Promise<Coords | null> {
  try {
    const { street, postalCode, city } = parseRomanianAddress(address);

    // Strategy 1: structured query with all available components
    const structured: Record<string, string> = { street, country: "Romania" };
    if (postalCode) structured.postalcode = postalCode;
    if (city) structured.city = city;

    let result = await nominatimQuery(structured);
    if (result) return result;

    // Strategy 2: structured query without postal code (postal codes often unknown to OSM)
    if (postalCode && city) {
      result = await nominatimQuery({ street, city, country: "Romania" });
      if (result) return result;
    }

    // Strategy 3: free-text query without postal code
    const freeText = city ? `${street}, ${city}, Romania` : `${street}, Romania`;
    result = await nominatimQuery({ q: freeText });
    if (result) return result;

    // Strategy 4: city-only as last resort to at least place the marker
    if (city) {
      result = await nominatimQuery({ q: `${city}, Romania` });
      if (result) return result;
    }

    console.log(`Geocoding failed for address "${address}"`);
    return null;
  } catch (error) {
    console.error(`Geocoding request failed for address "${address}"`, error);
    return null;
  }
}

async function resolveAddressCoordinates(address: string): Promise<Coords | null> {
  return parseAddressCoordinates(address) ?? geocodeAddress(address);
}
