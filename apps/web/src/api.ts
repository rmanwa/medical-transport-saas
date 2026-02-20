export type Role = 'SUPER_ADMIN' | 'STAFF';
export type Priority = 'NORMAL' | 'URGENT';
export type MeetingType = 'PHYSICAL' | 'VIRTUAL';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  canAccessAllBranches: boolean;
  branchIds: string[];
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  companyId: string;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  branchId: string;
};

export type Hospital = {
  id: string;
  name: string;
  address: string;
  companyId: string;
};

export type ShiftRow = {
  id: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  type: MeetingType;
  priority: Priority;
  patientId: string;
  branchId: string;
  hospitalId: string | null;
  branch?: { id: string; name: string };
  patient?: Patient;
  hospital?: Hospital | null;
};

export type DashboardOverview = {
  scope: { companyId: string; branchCount: number; isAllBranches: boolean };
  hospitalsTotal: number;
  window: { todayStartUtc: string; tomorrowStartUtc: string; next7DaysEndUtc: string };
  patientsTotal: number;
  shiftsTotal: number;
  shiftsToday: number;
  shiftsNext7Days: number;
  urgentTotal: number;
  urgentToday: number;
};

export type LoginResponse = { accessToken: string };

const TOKEN_KEY = 'accessToken';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    ...(init?.headers as any),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...init, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${init?.method || 'GET'} ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

// Auth
export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiGet<{ user: AuthUser }>('/me');
}

// Core
export async function getBranches(): Promise<Branch[]> {
  return apiGet<Branch[]>('/branches');
}

export async function getPatients(branchId: string): Promise<Patient[]> {
  return apiGet<Patient[]>(`/branches/${encodeURIComponent(branchId)}/patients`);
}

export async function createPatient(branchId: string, body: { firstName: string; lastName: string; gender: string; dateOfBirth: string }) {
  return apiPost<Patient>(`/branches/${encodeURIComponent(branchId)}/patients`, body);
}

// Dashboard
export async function getDashboardOverview(): Promise<DashboardOverview> {
  return apiGet<DashboardOverview>('/dashboard');
}

export async function getScheduleRange(params: { from: string; to: string; branchId?: string }) {
  const qs = new URLSearchParams({ from: params.from, to: params.to });
  if (params.branchId) qs.set('branchId', params.branchId);
  return apiGet<ShiftRow[]>(`/dashboard/schedule/range?${qs.toString()}`);
}
