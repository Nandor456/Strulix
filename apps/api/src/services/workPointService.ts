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

type PublicUserSummary = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type SelectedWorkPointSummary = {
  id: string;
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
};

type Coords = {
  lat: number;
  lng: number;
};

type SelectedWorkPointDetail = SelectedWorkPointSummary & {
  workers: Array<PublicUserSummary & { hourlyWage: number | null }>;
};

type SelectedAssignedWorkPointSummary = {
  id: string;
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
  workerIds?: string[];
};

export type UpdateWorkPointInput = Partial<WorkPointInput>;

export type WorkPointSummary = {
  id: string;
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
  attendanceCount: number;
};

export type AssignedWorkPointSummary = Omit<
  WorkPointSummary,
  "workerCount" | "attendanceCount"
>;

export type WorkPointDetail = WorkPointSummary & {
  workers: Array<PublicUserSummary & {
    hourlyWage: number | null;
  }>;
};

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
} as const;

const workPointSummarySelect = {
  id: true,
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
} as const;

const workPointDetailSelect = {
  ...workPointSummarySelect,
  workers: {
    select: {
      ...publicUserSelect,
      hourlyWage: true,
    },
    orderBy: { username: "asc" },
  },
} as const;

const assignedWorkPointSelect = {
  id: true,
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

function toSummary(workPoint: SelectedWorkPointSummary): WorkPointSummary {
  return {
    id: workPoint.id,
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
    attendanceCount: workPoint._count.attendances,
  };
}

function toDetail(workPoint: SelectedWorkPointDetail): WorkPointDetail {
  return {
    ...toSummary(workPoint),
    workers: workPoint.workers,
  };
}

function toAssignedSummary(
  workPoint: SelectedAssignedWorkPointSummary,
): AssignedWorkPointSummary {
  return {
    id: workPoint.id,
    name: workPoint.name,
    address: workPoint.address,
    lat: workPoint.lat,
    lng: workPoint.lng,
    description: workPoint.description,
    userId: workPoint.userId,
    uploadedAt: workPoint.uploadedAt.toISOString(),
    deadline: workPoint.deadline?.toISOString() ?? null,
    owner: workPoint.user,
  };
}

function uniqueIds(ids: string[] = []) {
  return Array.from(new Set(ids));
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

async function ensureWorkPointExists(id: string) {
  const workPoint = await prisma.workPoint.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!workPoint) {
    throw new Error("Work point not found");
  }
}

async function assertAssignableWorkers(workerIds: string[]) {
  if (workerIds.length === 0) return;

  const workers = await prisma.user.findMany({
    where: { id: { in: workerIds } },
    select: { id: true, role: true },
  });

  if (workers.length !== workerIds.length) {
    throw new Error("One or more workers were not found");
  }

  const invalidWorker = workers.find((worker) => worker.role !== "WORKER");
  if (invalidWorker) {
    throw new Error("Only users with the WORKER role can be assigned");
  }
}

async function syncChatParticipants(
  workPointId: string,
  workerIds: string[],
  ownerId?: string,
) {
  if (workerIds.length === 0 && !ownerId) return;

  const chatId = await getOrCreateWorkPointChat(workPointId);
  await Promise.all(workerIds.map((workerId) => addParticipantToChat(chatId, workerId)));
  if (ownerId) {
    await addParticipantToChat(chatId, ownerId);
  }
}

export async function listWorkPoints(): Promise<WorkPointSummary[]> {
  const workPoints = await prisma.workPoint.findMany({
    select: workPointSummarySelect,
    orderBy: [{ uploadedAt: "desc" }],
  });

  return workPoints.map(toSummary);
}

export async function listMyAssignedWorkPoints(
  userId: string,
): Promise<AssignedWorkPointSummary[]> {
  const workPoints = await prisma.workPoint.findMany({
    where: {
      workers: {
        some: { id: userId },
      },
    },
    select: assignedWorkPointSelect,
    orderBy: [{ uploadedAt: "desc" }],
  });

  return workPoints.map(toAssignedSummary);
}

export async function getWorkPointById(id: string): Promise<WorkPointDetail | null> {
  const workPoint = await prisma.workPoint.findUnique({
    where: { id },
    select: workPointDetailSelect,
  });

  return workPoint ? toDetail(workPoint) : null;
}

export async function createWorkPoint(
  input: WorkPointInput,
  ownerId?: string,
): Promise<WorkPointDetail> {
  const workerIds = uniqueIds(input.workerIds ?? []);
  await assertAssignableWorkers(workerIds);
  const coords = await resolveAddressCoordinates(input.address);

  const workPoint = await prisma.workPoint.create({
    data: {
      name: input.name,
      address: input.address,
      lat: coords?.lat ?? input.lat ?? null,
      lng: coords?.lng ?? input.lng ?? null,
      description: input.description ?? null,
      deadline: parseDeadline(input.deadline) ?? null,
      userId: ownerId,
      workers: workerIds.length
        ? { connect: workerIds.map((id) => ({ id })) }
        : undefined,
    },
    select: { id: true },
  });

  await syncChatParticipants(workPoint.id, workerIds, ownerId);

  const created = await getWorkPointById(workPoint.id);
  if (!created) {
    throw new Error("Work point not found");
  }

  return created;
}

export async function updateWorkPoint(
  id: string,
  input: UpdateWorkPointInput,
): Promise<WorkPointDetail> {
  await ensureWorkPointExists(id);
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

  const updated = await getWorkPointById(id);
  if (!updated) {
    throw new Error("Work point not found");
  }

  return updated;
}

export async function deleteWorkPoint(id: string): Promise<void> {
  await ensureWorkPointExists(id);
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
