import { useEffect, useMemo, useState } from 'react';
import { apiGet, getBranches, getDashboardOverview, getScheduleRange } from '../api';
import type { AuthUser, Branch, DashboardOverview, ShiftRow } from '../api';
import { addDays, fmt, toIsoStartOfDayLocal } from '../date';

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function DashboardPage() {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [fromIso, setFromIso] = useState(() => toIsoStartOfDayLocal(new Date()));
  const [toIso, setToIso] = useState(() => toIsoStartOfDayLocal(addDays(new Date(), 7)));
  const [schedule, setSchedule] = useState<ShiftRow[]>([]);
  const [error, setError] = useState('');

  const branchQuery = useMemo(() => selectedBranchId || undefined, [selectedBranchId]);

  async function load() {
    setError('');
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
      setError(e?.message ?? String(e));
      throw e;
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!me) return;
    getScheduleRange({ from: fromIso, to: toIso, branchId: branchQuery })
      .then(setSchedule)
      .catch((e) => setError(e?.message ?? String(e)));
  }, [me, fromIso, toIso, branchQuery]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      {me && (
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
          Logged in as <b>{me.name}</b> ({me.email}) — <b>{me.role}</b>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Branch:&nbsp;
          <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
            <option value="">All accessible branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          From:&nbsp;
          <input style={{ width: 260 }} value={fromIso} onChange={(e) => setFromIso(e.target.value)} />
        </label>
        <label>
          To:&nbsp;
          <input style={{ width: 260 }} value={toIso} onChange={(e) => setToIso(e.target.value)} />
        </label>

        <button onClick={() => load().catch(() => {})}>Refresh</button>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, border: '1px solid #f3b', borderRadius: 10 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        <Card title="Hospitals" value={overview?.hospitalsTotal ?? '—'} />
        <Card title="Patients Total" value={overview?.patientsTotal ?? '—'} />
        <Card title="Shifts Total" value={overview?.shiftsTotal ?? '—'} />
        <Card title="Shifts Today" value={overview?.shiftsToday ?? '—'} />
        <Card title="Next 7 Days" value={overview?.shiftsNext7Days ?? '—'} />
        <Card title="Urgent Today" value={overview?.urgentToday ?? '—'} />
      </div>

      <h3 style={{ marginTop: 22 }}>Schedule (Range)</h3>

      <div style={{ border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f6f6f6' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>When</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Branch</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Patient</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Hospital</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Priority</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {schedule.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 10, opacity: 0.7 }}>
                  No shifts in this range.
                </td>
              </tr>
            ) : (
              schedule.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    {fmt(s.startTime)} → {fmt(s.endTime)}
                  </td>
                  <td style={{ padding: 8 }}>{s.branch?.name ?? s.branchId}</td>
                  <td style={{ padding: 8 }}>
                    {s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : s.patientId}
                  </td>
                  <td style={{ padding: 8 }}>{s.hospital?.name ?? '—'}</td>
                  <td style={{ padding: 8 }}>{s.type}</td>
                  <td style={{ padding: 8 }}>{s.priority}</td>
                  <td style={{ padding: 8 }}>{s.notes ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
