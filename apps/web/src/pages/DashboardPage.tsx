import { useEffect, useMemo, useState } from 'react';
import { apiGet, getBranches, getDashboardOverview, getScheduleRange } from '../api';
import type { AuthUser, Branch, DashboardOverview, ShiftRow } from '../api';
import { addDays, fmt, toIsoStartOfDayLocal } from '../date';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

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

function StatCard({ icon, label, value, color = 'blue' }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { showToast } = useToast();
  const [me, setMe] = useState<AuthUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [fromIso, setFromIso] = useState(() => toIsoStartOfDayLocal(new Date()));
  const [toIso, setToIso] = useState(() => toIsoStartOfDayLocal(addDays(new Date(), 7)));
  const [schedule, setSchedule] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(false);

  const branchQuery = useMemo(() => selectedBranchId || undefined, [selectedBranchId]);

  async function load() {
    setLoading(true);
    try {
      const meRes = await apiGet<{ user: AuthUser }>('/me');
      setMe(meRes.user);

      const br = await getBranches();
      setBranches(br);

      const ov = await getDashboardOverview();
      setOverview(ov);

      const sch = await getScheduleRange({ from: fromIso, to: toIso, branchId: branchQuery });
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
    if (!me) return;
    setLoading(true);
    getScheduleRange({ from: fromIso, to: toIso, branchId: branchQuery })
      .then(setSchedule)
      .catch((e) => showToast(e?.message ?? 'Failed to load schedule', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, fromIso, toIso, branchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          {me && (
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-semibold">{me.name}</span> ({me.role})
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          icon={<RefreshIcon />}
          onClick={load}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={<ChartIcon />}
            label="Hospitals"
            value={overview.hospitalsTotal}
            color="blue"
          />
          <StatCard
            icon={<ChartIcon />}
            label="Total Patients"
            value={overview.patientsTotal}
            color="green"
          />
          <StatCard
            icon={<ChartIcon />}
            label="Total Shifts"
            value={overview.shiftsTotal}
            color="purple"
          />
          <StatCard
            icon={<ChartIcon />}
            label="Today"
            value={overview.shiftsToday}
            color="cyan"
          />
          <StatCard
            icon={<ChartIcon />}
            label="Next 7 Days"
            value={overview.shiftsNext7Days}
            color="amber"
          />
          <StatCard
            icon={<ChartIcon />}
            label="Urgent Today"
            value={overview.urgentToday}
            color="red"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader title="Filters" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">From</label>
              <input
                type="datetime-local"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={fromIso}
                onChange={(e) => setFromIso(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">To</label>
              <input
                type="datetime-local"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={toIso}
                onChange={(e) => setToIso(e.target.value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Schedule Table */}
      <Card>
        <CardHeader title={`Schedule (${schedule.length})`} />
        <CardBody>
          {loading && schedule.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 p-4">
                <ChartIcon />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">
                No shifts in this range
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule.map((s) => (
                <div
                  key={s.id}
                  className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={s.priority === 'URGENT' ? 'danger' : 'default'} dot>
                      {s.priority}
                    </Badge>
                    <Badge variant="primary">{s.type}</Badge>
                    <span className="text-sm text-slate-600">
                      {s.branch?.name || s.branchId}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">
                      {s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : s.patientId}
                    </div>
                    <div className="text-sm text-slate-600">
                      {fmt(s.startTime)} → {fmt(s.endTime)}
                    </div>
                    {s.hospital && (
                      <div className="text-sm text-slate-600">
                        Hospital: {s.hospital.name}
                      </div>
                    )}
                    {s.notes && (
                      <div className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded-lg">
                        {s.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}