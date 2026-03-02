import { useEffect, useState, useMemo } from 'react';
import { getBranches, getPatients, getScheduleRange, toMMDDYYYY } from '../api';
import type { AuthUser, Branch, Patient, ShiftRow } from '../api';
import { useToast } from '../ui/Toast';

const DownloadIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
const CalendarIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const UsersIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const SpinnerIcon = () => (<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>);
const CheckIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);

const inputCls = "w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition";
const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
const selectCls = `${inputCls} cursor-pointer`;

function escapeCSV(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}
function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers.map(escapeCSV).join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
}
function downloadCSV(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function startOfDay(d: string) { return new Date(`${d}T00:00:00`).toISOString(); }
function endOfDay(d: string) { return new Date(`${d}T23:59:59`).toISOString(); }

type Status = 'idle' | 'loading' | 'done' | 'error';
interface ExportPageProps { user: AuthUser; }

export function ExportPage({ user: _user }: ExportPageProps) {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('all');
  const firstOfMonth = new Date(); firstOfMonth.setDate(1);
  const [fromDate, setFromDate] = useState(firstOfMonth.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(todayISO());
  const [apptStatus, setApptStatus] = useState<Status>('idle');
  const [clientStatus, setClientStatus] = useState<Status>('idle');
  const [apptCount, setApptCount] = useState<number | null>(null);
  const [clientCount, setClientCount] = useState<number | null>(null);

  const dateRangeValid = useMemo(() => fromDate && toDate && new Date(fromDate) <= new Date(toDate), [fromDate, toDate]);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
  }, []);

  async function exportAppointments() {
    if (!dateRangeValid) { showToast('Please set a valid date range', 'error'); return; }
    setApptStatus('loading'); setApptCount(null);
    try {
      const params: any = { from: startOfDay(fromDate), to: endOfDay(toDate) };
      if (branchId !== 'all') params.branchId = branchId;
      const shifts: ShiftRow[] = await getScheduleRange(params);
      setApptCount(shifts.length);
      if (!shifts.length) { showToast('No appointments found', 'warning'); setApptStatus('idle'); return; }
      downloadCSV(buildCSV(
        ['Appointment ID','Patient Name','Date','Start Time','End Time','Type','Branch','Clinic','Notes'],
        shifts.map((s) => [s.id, s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : s.patientId, toMMDDYYYY(s.startTime),
          new Date(s.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}),
          new Date(s.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}),
          s.type, s.branch?.name ?? s.branchId, s.hospital?.name ?? '', s.notes ?? ''])
      ), `appointments_${fromDate}_to_${toDate}.csv`);
      showToast(`Exported ${shifts.length} appointments`, 'success');
      setApptStatus('done');
    } catch (e: any) { showToast(e?.message ?? 'Failed', 'error'); setApptStatus('error'); }
  }

  async function exportClients() {
    setClientStatus('loading'); setClientCount(null);
    try {
      let patients: Patient[] = [];
      if (branchId === 'all') {
        const all = branches.length ? branches : await getBranches();
        patients = (await Promise.all(all.map((b) => getPatients(b.id)))).flat();
      } else {
        patients = await getPatients(branchId);
      }
      setClientCount(patients.length);
      if (!patients.length) { showToast('No clients found', 'warning'); setClientStatus('idle'); return; }
      const bMap = new Map(branches.map((b) => [b.id, b.name]));
      downloadCSV(buildCSV(
        ['Client ID','First Name','Last Name','Gender','Date of Birth','Branch'],
        patients.map((p) => [p.id, p.firstName, p.lastName, p.gender, toMMDDYYYY(p.dateOfBirth), bMap.get(p.branchId) ?? p.branchId])
      ), `clients_${branchId === 'all' ? 'all-branches' : (branches.find((b) => b.id === branchId)?.name ?? branchId)}_${todayISO()}.csv`);
      showToast(`Exported ${patients.length} clients`, 'success');
      setClientStatus('done');
    } catch (e: any) { showToast(e?.message ?? 'Failed', 'error'); setClientStatus('error'); }
  }

  const quickRanges = [
    { label: 'Today', days: 0 }, { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 }, { label: 'Last 90 days', days: 90 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Export Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Download appointment and client data as CSV files</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Report Filters</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Branch</label>
            <select className={selectCls} value={branchId} onChange={(e) => { setBranchId(e.target.value); setApptCount(null); setClientCount(null); setApptStatus('idle'); setClientStatus('idle'); }}>
              <option value="all">All Branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>From Date</label>
            <input type="date" className={inputCls} value={fromDate} max={toDate} onChange={(e) => { setFromDate(e.target.value); setApptStatus('idle'); setApptCount(null); }} />
          </div>
          <div>
            <label className={labelCls}>To Date</label>
            <input type="date" className={inputCls} value={toDate} min={fromDate} max={todayISO()} onChange={(e) => { setToDate(e.target.value); setApptStatus('idle'); setApptCount(null); }} />
          </div>
        </div>
        {!dateRangeValid && fromDate && toDate && (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠ "From" date must be before or equal to "To" date</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 self-center">Quick:</span>
          {quickRanges.map(({ label, days }) => (
            <button key={label} onClick={() => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - days); setFromDate(from.toISOString().slice(0, 10)); setToDate(to.toISOString().slice(0, 10)); setApptStatus('idle'); setApptCount(null); }}
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition">
              {label}
            </button>
          ))}
          <button onClick={() => { const now = new Date(); const from = new Date(now.getFullYear(), now.getMonth(), 1); setFromDate(from.toISOString().slice(0, 10)); setToDate(now.toISOString().slice(0, 10)); setApptStatus('idle'); setApptCount(null); }}
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition">
            This Month
          </button>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Appointments */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400 shrink-0"><CalendarIcon /></div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appointments</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Export all appointments in the selected date range and branch.</p>
              <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                Columns: ID, Patient, Date, Start, End, Type, Branch, Clinic, Notes
              </div>
              {apptCount !== null && apptStatus !== 'loading' && (
                <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${apptCount === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  <span className={`h-2 w-2 rounded-full inline-block ${apptCount === 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
                  {apptCount === 0 ? 'No records found' : `${apptCount} record${apptCount !== 1 ? 's' : ''} ready`}
                </div>
              )}
              {apptStatus === 'done' && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium"><CheckIcon /> File downloaded successfully</div>
              )}
              <div className="mt-4">
                <button onClick={exportAppointments} disabled={apptStatus === 'loading' || !dateRangeValid}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {apptStatus === 'loading' ? <><SpinnerIcon /> Fetching…</> : <><DownloadIcon /> Export CSV</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clients */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-3 text-purple-600 dark:text-purple-400 shrink-0"><UsersIcon /></div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clients</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Export client records for the selected branch.</p>
              <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                Columns: ID, First Name, Last Name, Gender, DOB, Branch
              </div>
              {clientCount !== null && clientStatus !== 'loading' && (
                <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${clientCount === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  <span className={`h-2 w-2 rounded-full inline-block ${clientCount === 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
                  {clientCount === 0 ? 'No records found' : `${clientCount} record${clientCount !== 1 ? 's' : ''} ready`}
                </div>
              )}
              {clientStatus === 'done' && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium"><CheckIcon /> File downloaded successfully</div>
              )}
              <div className="mt-4">
                <button onClick={exportClients} disabled={clientStatus === 'loading'}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {clientStatus === 'loading' ? <><SpinnerIcon /> Fetching…</> : <><DownloadIcon /> Export CSV</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
          <svg className="h-5 w-5 shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">About CSV exports</p>
            <p>Files download directly to your device and can be opened in Excel, Google Sheets, or any spreadsheet application.</p>
            <p>Appointment exports are filtered by date range. Client exports pull all clients for the selected branch regardless of date.</p>
          </div>
        </div>
      </div>
    </div>
  );
}