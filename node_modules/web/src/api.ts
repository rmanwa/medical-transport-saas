export type Role = 'SUPER_ADMIN' | 'STAFF';
export type MeetingType = 'PHYSICAL' | 'VIRTUAL';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  canAccessAllBranches: boolean;
  branchIds: string[];
  mustChangePassword: boolean;
};

export type Branch = { id: string; name: string; address: string; companyId: string };
export type Patient = { id: string; firstName: string; lastName: string; gender: string; dateOfBirth: string; email?: string | null; branchId: string };
export type Hospital = { id: string; name: string; address: string; companyId: string };
export type ShiftRow = { id: string; startTime: string; endTime: string; notes: string | null; type: MeetingType; patientId: string; branchId: string; hospitalId: string | null; branch?: { id: string; name: string }; patient?: Patient; hospital?: Hospital | null };
export type DashboardOverview = { scope: { companyId: string; branchCount: number; isAllBranches: boolean }; hospitalsTotal: number; window: { todayStartUtc: string; tomorrowStartUtc: string; next7DaysEndUtc: string }; patientsTotal: number; shiftsTotal: number; shiftsToday: number; shiftsNext7Days: number; urgentTotal: number; urgentToday: number };

export type LoginResponse = { accessToken: string };
export type Login2FAResponse = { requires2FA: true; tempToken: string };
export type LoginResult = LoginResponse | Login2FAResponse;

export type StaffMember = { id: string; email: string; name: string; role: Role; canAccessAllBranches: boolean; branches: { id: string; name: string }[] };
export type SetupPayload = { adminName: string; adminEmail: string; adminPassword: string; companyName: string; branchName: string; branchAddress: string };

export type AuditAction = 'APPOINTMENT_CREATED' | 'APPOINTMENT_UPDATED' | 'APPOINTMENT_DELETED' | 'STAFF_INVITED' | 'STAFF_UPDATED' | 'STAFF_DELETED' | 'CLIENT_CREATED' | 'CLIENT_UPDATED' | 'CLIENT_DELETED' | 'BRANCH_CREATED' | 'BRANCH_UPDATED' | 'BRANCH_DELETED';
export type AuditLogEntry = { id: string; action: AuditAction; entityId: string; entityType: string; details: Record<string, any> | null; userId: string; user: { id: string; name: string; email: string }; companyId: string; createdAt: string };
export type AuditLogResponse = { items: AuditLogEntry[]; total: number; page: number; limit: number; totalPages: number };

// ─── Date Utilities ───────────────────────────────────────────────────────
export function toMMDDYYYY(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}
export function toMMDDYYYYTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  return `${toMMDDYYYY(d)} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

// ─── Token ────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'accessToken';
export function getToken(): string { return localStorage.getItem(TOKEN_KEY) || ''; }
export function setToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }

// ─── Fetch helpers ────────────────────────────────────────────────────────
async function apiFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = { ...(init?.headers as any) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${init?.method || 'GET'} ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return res;
}
export async function apiGet<T>(path: string): Promise<T> { const res = await apiFetch(path); return (await res.json()) as T; }
export async function apiPost<T>(path: string, body: any): Promise<T> { const res = await apiFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return (await res.json()) as T; }
export async function apiDelete<T>(path: string, body?: any): Promise<T> { const res = await apiFetch(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return (await res.json()) as T; }

// ─── Setup ────────────────────────────────────────────────────────────────
export async function getSetupStatus(): Promise<{ needsSetup: boolean }> { const res = await fetch('/api/setup/status'); if (!res.ok) throw new Error('Failed to check setup status'); return res.json(); }
export async function performSetup(payload: SetupPayload): Promise<LoginResponse> { const res = await fetch('/api/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) { const text = await res.text().catch(() => ''); throw new Error(text || 'Setup failed'); } return res.json(); }

// ─── Auth ─────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<LoginResult> { return apiPost<LoginResult>('/auth/login', { email, password }); }
export async function verify2FA(tempToken: string, code: string): Promise<LoginResponse> { return apiPost<LoginResponse>('/auth/2fa/verify', { tempToken, code }); }
export async function getMe(): Promise<{ user: AuthUser }> { return apiGet<{ user: AuthUser }>('/me'); }
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: true }> { const res = await apiFetch('/auth/change-password', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) }); return (await res.json()) as any; }

// ─── 2FA Management ──────────────────────────────────────────────────────
export async function get2FAStatus(): Promise<{ enabled: boolean }> { return apiGet<{ enabled: boolean }>('/auth/2fa/status'); }
export async function setup2FA(): Promise<{ qrCodeDataUrl: string; secret: string }> { return apiPost<{ qrCodeDataUrl: string; secret: string }>('/auth/2fa/setup', {}); }
export async function confirm2FA(code: string): Promise<{ ok: true }> { return apiPost<{ ok: true }>('/auth/2fa/confirm', { code }); }
export async function disable2FA(password: string): Promise<{ ok: true }> { return apiDelete<{ ok: true }>('/auth/2fa', { password }); }

// ─── Forgot / Reset Password ─────────────────────────────────────────────
export async function forgotPassword(email: string): Promise<{ ok: true }> { return apiPost<{ ok: true }>('/auth/forgot-password', { email }); }
export async function resetPassword(email: string, code: string, newPassword: string): Promise<{ ok: true }> { return apiPost<{ ok: true }>('/auth/reset-password', { email, code, newPassword }); }

// ─── Branches ─────────────────────────────────────────────────────────────
export async function getBranches(): Promise<Branch[]> { return apiGet<Branch[]>('/branches'); }
export async function createBranch(body: { name: string; address: string }): Promise<Branch> { return apiPost<Branch>('/branches', body); }

// ─── Patients ─────────────────────────────────────────────────────────────
export async function getPatients(branchId: string): Promise<Patient[]> { return apiGet<Patient[]>(`/branches/${encodeURIComponent(branchId)}/patients`); }
export async function createPatient(branchId: string, body: { firstName: string; lastName: string; gender: string; dateOfBirth: string; email?: string }) { return apiPost<Patient>(`/branches/${encodeURIComponent(branchId)}/patients`, body); }
export async function updatePatient(branchId: string, patientId: string, body: { firstName?: string; lastName?: string; gender?: string; dateOfBirth?: string; email?: string }): Promise<Patient> { const res = await apiFetch(`/branches/${encodeURIComponent(branchId)}/patients/${encodeURIComponent(patientId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return (await res.json()) as Patient; }
export async function deletePatient(branchId: string, patientId: string): Promise<{ ok: true }> { const res = await apiFetch(`/branches/${encodeURIComponent(branchId)}/patients/${encodeURIComponent(patientId)}`, { method: 'DELETE' }); return (await res.json()) as { ok: true }; }

// ─── Dashboard ────────────────────────────────────────────────────────────
export async function getDashboardOverview(): Promise<DashboardOverview> { return apiGet<DashboardOverview>('/dashboard'); }
export async function getScheduleRange(params: { from: string; to: string; branchId?: string }) { const qs = new URLSearchParams({ from: params.from, to: params.to }); if (params.branchId) qs.set('branchId', params.branchId); return apiGet<ShiftRow[]>(`/dashboard/schedule/range?${qs.toString()}`); }

// ─── Hospitals ────────────────────────────────────────────────────────────
export async function getHospitals(): Promise<Hospital[]> { return apiGet<Hospital[]>('/hospitals'); }
export async function createHospital(body: { name: string; address: string }): Promise<Hospital> { return apiPost<Hospital>('/hospitals', body); }
export async function updateHospital(id: string, body: { name?: string; address?: string }): Promise<Hospital> { const res = await apiFetch(`/hospitals/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return (await res.json()) as Hospital; }
export async function deleteHospital(id: string): Promise<{ ok: true }> { const res = await apiFetch(`/hospitals/${encodeURIComponent(id)}`, { method: 'DELETE' }); return (await res.json()) as { ok: true }; }

// ─── Staff Management ────────────────────────────────────────────────────
export async function getStaff(): Promise<StaffMember[]> { return apiGet<StaffMember[]>('/staff'); }
export async function getStaffMember(id: string): Promise<StaffMember> { return apiGet<StaffMember>(`/staff/${encodeURIComponent(id)}`); }
export async function inviteStaff(body: { name: string; email: string; password: string; branchIds: string[] }): Promise<{ id: string; email: string; name: string; role: string; branchIds: string[] }> { return apiPost('/staff/invite', body); }
export async function updateStaff(id: string, body: { name?: string; email?: string }): Promise<{ id: string; email: string; name: string; role: string }> { const res = await apiFetch(`/staff/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return (await res.json()) as any; }
export async function updateStaffBranches(id: string, branchIds: string[]): Promise<{ ok: true; branchIds: string[] }> { const res = await apiFetch(`/staff/${encodeURIComponent(id)}/branches`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branchIds }) }); return (await res.json()) as any; }
export async function deleteStaff(id: string): Promise<{ ok: true }> { const res = await apiFetch(`/staff/${encodeURIComponent(id)}`, { method: 'DELETE' }); return (await res.json()) as any; }

// ─── Shifts ───────────────────────────────────────────────────────────────
export async function createShift(branchId: string, body: { startTime: string; endTime: string; notes?: string; type?: MeetingType; patientId: string; hospitalId?: string | null }) { return apiPost<ShiftRow>(`/branches/${encodeURIComponent(branchId)}/shifts`, body); }

// ─── Audit Trail ─────────────────────────────────────────────────────────
export async function getAuditLogs(params: { action?: AuditAction; userId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<AuditLogResponse> { const qs = new URLSearchParams(); if (params.action) qs.set('action', params.action); if (params.userId) qs.set('userId', params.userId); if (params.startDate) qs.set('startDate', params.startDate); if (params.endDate) qs.set('endDate', params.endDate); if (params.page) qs.set('page', String(params.page)); if (params.limit) qs.set('limit', String(params.limit)); return apiGet<AuditLogResponse>(`/audit?${qs.toString()}`); }