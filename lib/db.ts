import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const INCIDENTS_FILE = path.join(DATA_DIR, "incidents.json");

export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type ConversationHistory = Message[];

export type IncidentStatus = "Open" | "Escalated" | "Resolved";

export type KBReference = {
  file: string;
  snippet: string;
};

export type EscalationData = {
  reason: string;
  group: string;
  priority: number;
  urgency: number;
  impact: number;
  timestamp: string;
};

export type ResolutionData = {
  timestamp: string;
  summary: string;
};

export type Feedback = {
  rating: number;
  comment: string;
  timestamp: string;
};

export type Incident = {
  incidentId: string;
  userId: string;
  status: IncidentStatus;
  category: string;
  conversationHistory: ConversationHistory;
  kbReferences: KBReference[];
  escalationDetails: EscalationData | null;
  resolutionDetails: ResolutionData | null;
  feedback: Feedback | null;
  currentStep?: string;
  createdAt: string;
  updatedAt: string;
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf-8");
  }
  try {
    await fs.access(INCIDENTS_FILE);
  } catch {
    await fs.writeFile(INCIDENTS_FILE, "[]", "utf-8");
  }
}

async function readJSON<T>(file: string): Promise<T> {
  await ensureDataDir();
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJSON<T>(file: string, data: T): Promise<void> {
  await ensureDataDir();
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

// ---------- USERS ----------

export async function getUsers(): Promise<User[]> {
  return readJSON<User[]>(USERS_FILE);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const users = await getUsers();
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const user: User = {
    id,
    username: input.username,
    email: input.email,
    password: input.password,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeJSON(USERS_FILE, users);
  return user;
}

// ---------- INCIDENTS ----------

export async function getIncidents(): Promise<Incident[]> {
  return readJSON<Incident[]>(INCIDENTS_FILE);
}

export async function getIncidentsByUser(userId: string): Promise<Incident[]> {
  const all = await getIncidents();
  return all.filter((i) => i.userId === userId);
}

export async function getIncidentById(incidentId: string): Promise<Incident | null> {
  const all = await getIncidents();
  return all.find((i) => i.incidentId === incidentId) ?? null;
}

export async function createIncident(input: {
  userId: string;
  category: string;
  firstMessage?: Message;
}): Promise<Incident> {
  const all = await getIncidents();
  const id = `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const incident: Incident = {
    incidentId: id,
    userId: input.userId,
    status: "Open",
    category: input.category,
    conversationHistory: input.firstMessage ? [input.firstMessage] : [],
    kbReferences: [],
    escalationDetails: null,
    resolutionDetails: null,
    feedback: null,
    currentStep: undefined,
    createdAt: now,
    updatedAt: now,
  };
  all.push(incident);
  await writeJSON(INCIDENTS_FILE, all);
  return incident;
}

async function persistIncident(updated: Incident): Promise<Incident> {
  const all = await getIncidents();
  const idx = all.findIndex((i) => i.incidentId === updated.incidentId);
  if (idx === -1) throw new Error(`Incident ${updated.incidentId} not found`);
  updated.updatedAt = new Date().toISOString();
  all[idx] = updated;
  await writeJSON(INCIDENTS_FILE, all);
  return updated;
}

export async function appendMessage(
  incidentId: string,
  message: Message,
): Promise<Incident | null> {
  const inc = await getIncidentById(incidentId);
  if (!inc) return null;
  inc.conversationHistory.push(message);
  return persistIncident(inc);
}

export async function updateIncident(
  incidentId: string,
  patch: Partial<Omit<Incident, "incidentId" | "userId" | "createdAt">>,
): Promise<Incident | null> {
  const inc = await getIncidentById(incidentId);
  if (!inc) return null;
  const updated = { ...inc, ...patch };
  return persistIncident(updated);
}

export async function setStatus(
  incidentId: string,
  status: IncidentStatus,
  extras?: Partial<Incident>,
): Promise<Incident | null> {
  return updateIncident(incidentId, { status, ...extras });
}

export async function setFeedback(
  incidentId: string,
  feedback: Feedback,
): Promise<Incident | null> {
  return updateIncident(incidentId, { feedback });
}
