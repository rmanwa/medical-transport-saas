import { useEffect, useMemo, useState } from 'react';
import { getBranches, getDashboardOverview, getScheduleRange, toMMDDYYYY, toMMDDYYYYTime } from '../api';
import type { AuthUser, Branch, DashboardOverview, ShiftRow } from '../api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { useToast } from '../ui/Toast';
import { addDays, toIsoStartOfDayLocal } from '../date';

// Icons
const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

function StatCard({
  icon,
  label,
  value,
  color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  };

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${colorClasses[color] ?? colorClasses.blue}`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  user: AuthUser;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPage({ user }: DashboardPageProps) {
  const { showToast } = useToast();

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canSwitchBranch = isSuperAdmin || user.canAccessAllBranches;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [fromIso, setFromIso] = useState(() => toIsoStartOfDayLocal(new Date()));
  const [toIso, setToIso] = useState(() => toIsoStartOfDayLocal(addDays(new Date(), 7)));
  const [schedule, setSchedule] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(false);

  const branchQuery = useMemo(() => selectedBranchId || undefined, [selectedBranchId]);

  /**
   * Filter the full branch list to only those the user is assigned to,
   * unless they can access all branches.
   */
  function scopeBranches(all: Branch[]): Branch[] {
    if (canSwitchBranch) return all;
    return all.filter((b) => user.branchIds.includes(b.id));
  }

  async function load() {
    setLoading(true);
    try {
      const [br, ov, sch] = await Promise.all([
        getBranches(),
        // Only fetch overview metrics for SUPER_ADMIN
        isSuperAdmin ? getDashboardOverview() : Promise.resolve(null),
        getScheduleRange({ from: fromIso, to: toIso, branchId: branchQuery }),
      ]);

      const scoped = scopeBranches(br);
      setBranches(scoped);

      // For STAFF: auto-select their first assigned branch if nothing selected
      if (!selectedBranchId && scoped.length > 0) {
        setSelectedBranchId(scoped[0].id);
      }

      if (ov) setOverview(ov);
      setSchedule(sch);
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    getScheduleRange({ from: fromIso, to: toIso, branchId: branchQuery })
      .then(setSchedule)
      .catch((e) => showToast(e?.message ?? 'Failed to load schedule', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromIso, toIso, branchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Welcome back, <span className="font-semibold">{user.name}</span>
            {!canSwitchBranch && branches.length > 0 && (
              <span className="ml-1 text-slate-500 dark:text-slate-400">
                — viewing{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {branches.map((b) => b.name).join(', ')}
                </span>
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" icon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* ── Metrics: SUPER_ADMIN only ── */}
      {isSuperAdmin && overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={<ChartIcon />} label="Hospitals" value={overview.hospitalsTotal} color="blue" />
          <StatCard icon={<ChartIcon />} label="Total Clients" value={overview.patientsTotal} color="green" />
          <StatCard icon={<ChartIcon />} label="Total Appointments" value={overview.shiftsTotal} color="purple" />
          <StatCard icon={<ChartIcon />} label="Today" value={overview.shiftsToday} color="cyan" />
          <StatCard icon={<ChartIcon />} label="Next 7 Days" value={overview.shiftsNext7Days} color="amber" />
        </div>
      )}

      {/* ── Filters ── */}
      <Card>
        <CardHeader title="Filters" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Branch selector: shown to SUPER_ADMIN / canAccessAllBranches users only */}
            {canSwitchBranch ? (
              <Select
                label="Branch"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="">All accessible branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            ) : (
              /* STAFF: show their branch(es) as read-only info */
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Branch</label>
                <div className="flex flex-wrap gap-1.5">
                  {branches.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2.5 py-1 text-sm font-medium text-blue-800 dark:text-blue-300"
                    >
                      {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">From</label>
              <input
                type="datetime-local"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={fromIso}
                onChange={(e) => setFromIso(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To</label>
              <input
                type="datetime-local"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={toIso}
                onChange={(e) => setToIso(e.target.value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Schedule Table ── */}
      <Card>
        <CardHeader title={`Schedule (${schedule.length})`} />
        <CardBody>
          {loading && schedule.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 dark:bg-slate-700 p-4 text-slate-400 dark:text-slate-500">
                <CalendarIcon />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">No appointments in this range</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Patient Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Clinic / Branch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Type
                    </th>
                    {/* Hospital Stats column: SUPER_ADMIN only */}
                    {isSuperAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Hospital
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {schedule.map((s, idx) => {
                    const name = s.patient
                      ? `${s.patient.firstName} ${s.patient.lastName}`
                      : s.patientId.slice(0, 8);
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/20'}`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{name}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{toMMDDYYYY(s.startTime)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(s.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {s.branch?.name ?? s.branchId}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              s.type === 'PHYSICAL'
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            }`}
                          >
                            {s.type === 'PHYSICAL' ? 'Physical' : 'Virtual'}
                          </span>
                        </td>
                        {/* Hospital Stats: SUPER_ADMIN only */}
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {s.hospital?.name ?? <span className="text-slate-400 dark:text-slate-600">—</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}