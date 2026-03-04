import { useCallback, useEffect, useState } from 'react';
import { getAuditLogs, getStaff } from '../api';
import type { AuditAction, AuditLogEntry, AuditLogResponse, StaffMember } from '../api';
import { useToast } from '../ui/Toast';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ClipboardIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<AuditAction, string> = {
  APPOINTMENT_CREATED: 'Appointment Created',
  APPOINTMENT_UPDATED: 'Appointment Updated',
  APPOINTMENT_DELETED: 'Appointment Deleted',
  STAFF_INVITED: 'Staff Invited',
  STAFF_UPDATED: 'Staff Updated',
  STAFF_DELETED: 'Staff Deleted',
  CLIENT_CREATED: 'Client Added',
  CLIENT_UPDATED: 'Client Updated',
  CLIENT_DELETED: 'Client Deleted',
  BRANCH_CREATED: 'Branch Created',
  BRANCH_UPDATED: 'Branch Updated',
  BRANCH_DELETED: 'Branch Deleted',
};

function getActionBadgeClass(action: string): string {
  if (action.includes('CREATED') || action.includes('INVITED'))
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
  if (action.includes('UPDATED'))
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
  if (action.includes('DELETED'))
    return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800';
  return 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Phoenix',
  });
}

function summarizeDetails(details: Record<string, any> | null): string {
  if (!details) return '';
  const parts: string[] = [];
  if (details.clientName) parts.push(details.clientName);
  if (details.patientName) parts.push(details.patientName);
  if (details.staffName) parts.push(details.staffName);
  if (details.staffEmail) parts.push(details.staffEmail);
  if (details.branchName) parts.push(`Branch: ${details.branchName}`);
  if (details.updatedFields) parts.push(`Fields: ${details.updatedFields.join(', ')}`);
  if (details.type) parts.push(`Type: ${details.type}`);
  if (details.priority && details.priority !== 'NORMAL') parts.push(`Priority: ${details.priority}`);
  if (details.startTime) {
    parts.push(`Time: ${new Date(details.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix',
    })}`);
  }
  return parts.join(' · ');
}

const ACTION_OPTIONS: { label: string; value: string; disabled?: boolean }[] = [
  { label: 'All Actions', value: '' },
  { label: '── Appointments ──', value: '', disabled: true },
  { label: 'Created', value: 'APPOINTMENT_CREATED' },
  { label: 'Updated', value: 'APPOINTMENT_UPDATED' },
  { label: 'Deleted', value: 'APPOINTMENT_DELETED' },
  { label: '── Staff ──', value: '', disabled: true },
  { label: 'Invited', value: 'STAFF_INVITED' },
  { label: 'Updated', value: 'STAFF_UPDATED' },
  { label: 'Deleted', value: 'STAFF_DELETED' },
  { label: '── Clients ──', value: '', disabled: true },
  { label: 'Added', value: 'CLIENT_CREATED' },
  { label: 'Updated', value: 'CLIENT_UPDATED' },
  { label: 'Deleted', value: 'CLIENT_DELETED' },
  { label: '── Branches ──', value: '', disabled: true },
  { label: 'Created', value: 'BRANCH_CREATED' },
  { label: 'Updated', value: 'BRANCH_UPDATED' },
  { label: 'Deleted', value: 'BRANCH_DELETED' },
];

const inputCls = "w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition";
const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

// ─── Component ────────────────────────────────────────────────────────────────

export function AuditLogPage() {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Filters
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Load staff for the "Performed By" filter
  useEffect(() => {
    getStaff().then(setStaffList).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: AuditLogResponse = await getAuditLogs({
        action: action ? (action as AuditAction) : undefined,
        userId: userId || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
        page,
        limit,
      });
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [action, userId, startDate, endDate, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [action, userId, startDate, endDate]);

  const hasFilters = !!(action || userId || startDate || endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Log</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Track all actions across appointments, staff, clients, and branches
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition disabled:opacity-50">
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Filters</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>Action Type</label>
            <select className={`${inputCls} cursor-pointer`} value={action} onChange={(e) => setAction(e.target.value)}>
              {ACTION_OPTIONS.map((opt, i) =>
                opt.disabled
                  ? <option key={i} disabled>{opt.label}</option>
                  : <option key={i} value={opt.value}>{opt.label}</option>
              )}
            </select>
          </div>
          <div>
            <label className={labelCls}>Performed By</label>
            <select className={`${inputCls} cursor-pointer`} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All Users</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>From</label>
            <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => { setAction(''); setUserId(''); setStartDate(''); setEndDate(''); }}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all filters
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">{total} result{total !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Activity ({total})
          </h3>
        </div>

        {loading && logs.length === 0 ? (
          <div className="p-4 space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)}</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-slate-100 dark:bg-slate-700 p-4 text-slate-400 dark:text-slate-500"><ClipboardIcon /></div>
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">No audit log entries found</p>
            {hasFilters && <button onClick={() => { setAction(''); setUserId(''); setStartDate(''); setEndDate(''); }} className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Clear filters</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date &amp; Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Performed By</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {logs.map((log, idx) => (
                  <tr key={log.id} className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/20'}`}>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getActionBadgeClass(log.action)}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{log.user.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{log.user.email}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {summarizeDetails(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-5 py-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 px-3 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 px-3 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}