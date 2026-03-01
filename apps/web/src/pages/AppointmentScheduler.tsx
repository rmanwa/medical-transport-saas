import { useEffect, useMemo, useState } from 'react';
import { createShift, getBranches, getHospitals, getPatients, getScheduleRange, toMMDDYYYY, toMMDDYYYYTime } from '../api';
import type { AuthUser, Branch, Hospital, MeetingType, Patient, ShiftRow } from '../api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Modal, ModalActions } from '../ui/Modal';
import { useToast } from '../ui/Toast';

// Icons
const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const NoteIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function toLocalDateTimeInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function addMinutes(d: Date, minutes: number) {
  const copy = new Date(d.getTime());
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
}

function startOfDayLocal(d: Date) {
  const x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x;
}

function endOfDayLocal(d: Date) {
  const x = new Date(d.getTime()); x.setHours(23, 59, 59, 999); return x;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppointmentSchedulerProps {
  user: AuthUser;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentScheduler({ user }: AppointmentSchedulerProps) {
  const { showToast } = useToast();

  const canSwitchBranch = user.role === 'SUPER_ADMIN' || user.canAccessAllBranches;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [schedule, setSchedule] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [branchId, setBranchId] = useState('');
  const [rangeFrom, setRangeFrom] = useState(() => toLocalDateTimeInputValue(startOfDayLocal(new Date())));
  const [rangeTo, setRangeTo] = useState(() => toLocalDateTimeInputValue(endOfDayLocal(new Date())));

  // Create modal state — Priority removed: every appointment is urgent
  const [createOpen, setCreateOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [type, setType] = useState<MeetingType>('PHYSICAL');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState(() => toLocalDateTimeInputValue(new Date()));
  const [endTime, setEndTime] = useState(() => toLocalDateTimeInputValue(addMinutes(new Date(), 30)));

  const selectedBranch = useMemo(() => branches.find((b) => b.id === branchId) ?? null, [branches, branchId]);
  const hasClients = clients.length > 0;

  const stats = useMemo(() => {
    const today = startOfDayLocal(new Date());
    const todayEnd = endOfDayLocal(new Date());
    return {
      total: schedule.length,
      today: schedule.filter((s) => {
        const d = new Date(s.startTime);
        return d >= today && d <= todayEnd;
      }).length,
      physical: schedule.filter((s) => s.type === 'PHYSICAL').length,
      virtual: schedule.filter((s) => s.type === 'VIRTUAL').length,
    };
  }, [schedule]);

  /** Filter all company branches down to those this user can see */
  function scopeBranches(all: Branch[]): Branch[] {
    if (canSwitchBranch) return all;
    return all.filter((b) => user.branchIds.includes(b.id));
  }

  // Load branches (scoped)
  useEffect(() => {
    (async () => {
      try {
        const all = await getBranches();
        const scoped = scopeBranches(all);
        setBranches(scoped);
        if (scoped.length && !branchId) setBranchId(scoped[0].id);
      } catch (e: any) {
        showToast(e?.message ?? 'Failed to load branches', 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load hospitals (all users can see clinics for booking)
  useEffect(() => {
    (async () => {
      try {
        const data = await getHospitals();
        setHospitals(data);
      } catch (e: any) {
        showToast(e?.message ?? 'Failed to load hospitals', 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load clients for the selected branch
  useEffect(() => {
    if (!branchId) return;
    (async () => {
      try {
        setClients([]); setClientId('');
        const data = await getPatients(branchId);
        setClients(data);
        if (data.length) setClientId(data[0].id);
      } catch (e: any) {
        showToast(e?.message ?? 'Failed to load clients', 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  async function refreshSchedule() {
    if (!branchId) { showToast('Please select a branch', 'warning'); return; }
    setLoading(true);
    try {
      const data = await getScheduleRange({
        from: new Date(rangeFrom).toISOString(),
        to: new Date(rangeTo).toISOString(),
        branchId,
      });
      setSchedule(data);
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (branchId) refreshSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, rangeFrom, rangeTo]);

  function setQuickRange(preset: 'today' | 'tomorrow' | 'week') {
    const now = new Date();
    let from: Date, to: Date;
    if (preset === 'today') {
      from = startOfDayLocal(now); to = endOfDayLocal(now);
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
      from = startOfDayLocal(tomorrow); to = endOfDayLocal(tomorrow);
    } else {
      from = startOfDayLocal(now);
      const week = new Date(now); week.setDate(week.getDate() + 7);
      to = endOfDayLocal(week);
    }
    setRangeFrom(toLocalDateTimeInputValue(from));
    setRangeTo(toLocalDateTimeInputValue(to));
  }

  // Sanitize a value for datetime-local input — strips seconds/ms/timezone if present
  function sanitizeDateTimeInput(val: string): string {
    if (!val) return val;
    // Already in correct format yyyy-MM-ddThh:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) return val;
    // ISO string or other — convert via Date
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return toLocalDateTimeInputValue(d);
  }

  async function onCreate() {
    if (!branchId) { showToast('Please select a branch', 'error'); return; }
    if (!hasClients) { showToast('No clients in this branch', 'error'); return; }
    if (!clientId) { showToast('Please select a client', 'error'); return; }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) { showToast('End time must be after start time', 'error'); return; }

    setLoading(true);
    try {
      await createShift(branchId, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type,
        // Priority removed — all appointments are urgent by business logic
        notes: notes.trim() || undefined,
        patientId: clientId,
        hospitalId: hospitalId || null,
      });
      showToast('Appointment created successfully!', 'success');
      setNotes('');
      setCreateOpen(false);
      await refreshSchedule();
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to create appointment', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointment Scheduler</h1>
          <p className="mt-1 text-sm text-slate-600">Create and manage client appointments</p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon />}
          onClick={() => setCreateOpen(true)}
          disabled={!branchId || !hasClients}
        >
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600"><CalendarIcon /></div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3 text-green-600"><ClockIcon /></div>
            <div>
              <p className="text-sm font-medium text-slate-600">Today</p>
              <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600"><BuildingIcon /></div>
            <div>
              <p className="text-sm font-medium text-slate-600">Physical</p>
              <p className="text-2xl font-bold text-slate-900">{stats.physical}</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-100 p-3 text-cyan-600"><CalendarIcon /></div>
            <div>
              <p className="text-sm font-medium text-slate-600">Virtual</p>
              <p className="text-2xl font-bold text-slate-900">{stats.virtual}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader title="Filters" />
        <CardBody>
          <div className="space-y-4">
            {/* Branch: full selector for admins, locked display for staff */}
            {canSwitchBranch ? (
              <Select
                label="Branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loading}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Branch
                  {branches.length > 1 && (
                    <span className="ml-1.5 text-xs font-normal text-slate-500">(your assigned branches)</span>
                  )}
                </label>
                {branches.length === 1 ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 h-11">
                    <span className="font-medium text-slate-800">{branches[0].name}</span>
                    <span className="ml-auto text-xs text-slate-400 italic">assigned</span>
                  </div>
                ) : (
                  <Select
                    label=""
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    disabled={loading}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {/* Quick range buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setQuickRange('today')}>Today</Button>
              <Button variant="ghost" size="sm" onClick={() => setQuickRange('tomorrow')}>Tomorrow</Button>
              <Button variant="ghost" size="sm" onClick={() => setQuickRange('week')}>Next 7 Days</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">From</label>
                <input
                  type="datetime-local"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={sanitizeDateTimeInput(rangeFrom)}
                  onChange={(e) => setRangeFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">To</label>
                <input
                  type="datetime-local"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={sanitizeDateTimeInput(rangeTo)}
                  onChange={(e) => setRangeTo(e.target.value)}
                />
              </div>
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
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : schedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 p-4"><CalendarIcon /></div>
              <p className="mt-4 text-sm font-medium text-slate-600">No appointments in this range</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Patient Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Nature
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Clinic / Branch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Clinic
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {schedule.map((s, idx) => {
                    const name = s.patient
                      ? `${s.patient.firstName} ${s.patient.lastName}`
                      : s.patientId.slice(0, 8);
                    const date = toMMDDYYYY(s.startTime);
                    const startT = new Date(s.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    });
                    const endT = new Date(s.endTime).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    });
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        {/* Patient */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                              {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900">{name}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                          {date}
                        </td>

                        {/* Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          <div className="flex items-center gap-1">
                            <ClockIcon />
                            <span>{startT} – {endT}</span>
                          </div>
                        </td>

                        {/* Nature of appointment */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            s.type === 'PHYSICAL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {s.type === 'PHYSICAL' ? '🏥 Physical' : '💻 Virtual'}
                          </span>
                        </td>

                        {/* Clinic / Branch */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <BuildingIcon />
                            <span>{s.branch?.name ?? s.branchId}</span>
                          </div>
                        </td>

                        {/* Clinic */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {s.hospital?.name ?? (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-3 max-w-[180px]">
                          {s.notes ? (
                            <span className="block truncate text-slate-500 italic" title={s.notes}>
                              {s.notes}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Modal — Priority field removed */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Appointment" size="lg">
        <div className="space-y-4">
          {!hasClients && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertIcon /><span>No clients in this branch. Please add clients first.</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={!hasClients}
              required
            >
              {clients.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </Select>

            <Select
              label="Clinic (Optional)"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              <option value="">None</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Select>
          </div>

          {/* Type only — Priority removed */}
          <Select
            label="Appointment Type"
            value={type}
            onChange={(e) => setType(e.target.value as MeetingType)}
            required
          >
            <option value="PHYSICAL">Physical Visit</option>
            <option value="VIRTUAL">Virtual (Telehealth)</option>
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  const st = new Date(e.target.value);
                  const et = new Date(endTime);
                  if (!isNaN(st.getTime()) && !isNaN(et.getTime()) && et <= st) {
                    setEndTime(toLocalDateTimeInputValue(addMinutes(st, 30)));
                  }
                }}
                required
              />
              {startTime && (
                <p className="mt-1 text-xs text-slate-500">{toMMDDYYYYTime(new Date(startTime).toISOString())}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              {endTime && (
                <p className="mt-1 text-xs text-slate-500">{toMMDDYYYYTime(new Date(endTime).toISOString())}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notes (Optional)</label>
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="Add any special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Appointment will be created for <strong>{selectedBranch?.name}</strong>.</span>
          </div>
        </div>

        <div className="mt-6">
          <ModalActions
            onCancel={() => setCreateOpen(false)}
            onConfirm={onCreate}
            cancelLabel="Cancel"
            confirmLabel="Create Appointment"
            loading={loading}
          />
        </div>
      </Modal>
    </div>
  );
}