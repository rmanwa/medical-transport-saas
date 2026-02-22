import { useEffect, useMemo, useState } from 'react';
import { createShift, getBranches, getHospitals, getPatients, getScheduleRange } from '../api';
import type { Branch, Hospital, MeetingType, Patient, Priority, ShiftRow } from '../api';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// For <input type="datetime-local" />
function toLocalDateTimeInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function addMinutes(d: Date, minutes: number) {
  const copy = new Date(d.getTime());
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
}

function startOfDayLocal(d: Date) {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDayLocal(d: Date) {
  const x = new Date(d.getTime());
  x.setHours(23, 59, 0, 0);
  return x;
}

export default function ShiftsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [schedule, setSchedule] = useState<ShiftRow[]>([]);

  const [branchId, setBranchId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [hospitalId, setHospitalId] = useState<string>(''); // optional

  const [type, setType] = useState<MeetingType>('PHYSICAL');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [notes, setNotes] = useState('');

  const [startTime, setStartTime] = useState(() => toLocalDateTimeInputValue(new Date()));
  const [endTime, setEndTime] = useState(() => toLocalDateTimeInputValue(addMinutes(new Date(), 30)));

  const [rangeFrom, setRangeFrom] = useState(() => toLocalDateTimeInputValue(startOfDayLocal(new Date())));
  const [rangeTo, setRangeTo] = useState(() => toLocalDateTimeInputValue(endOfDayLocal(new Date())));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedBranch = useMemo(() => branches.find((b) => b.id === branchId) || null, [branches, branchId]);
  const selectedPatient = useMemo(() => patients.find((p) => p.id === patientId) || null, [patients, patientId]);
  const selectedHospital = useMemo(() => hospitals.find((h) => h.id === hospitalId) || null, [hospitals, hospitalId]);

  const hasPatients = patients.length > 0;

  // Load branches
  useEffect(() => {
    (async () => {
      try {
        setError('');
        const data = await getBranches();
        setBranches(data);
        if (data.length && !branchId) setBranchId(data[0].id);
      } catch (e: any) {
        setError(e.message || 'Failed to load branches');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load hospitals (company-wide)
  useEffect(() => {
    (async () => {
      try {
        setError('');
        const data = await getHospitals();
        setHospitals(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load hospitals');
      }
    })();
  }, []);

  // Load patients when branch changes
  useEffect(() => {
    if (!branchId) return;
    (async () => {
      try {
        setError('');
        setMessage('');
        setPatients([]);
        setPatientId('');

        const data = await getPatients(branchId);
        setPatients(data);
        if (data.length) setPatientId(data[0].id);
      } catch (e: any) {
        setError(e.message || 'Failed to load patients');
      }
    })();
  }, [branchId]);

  function validateCreateTimes(): string | null {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Start and end time must be valid.';
    if (end <= start) return 'End time must be after start time.';
    return null;
  }

  function validateRangeTimes(): string | null {
    const from = new Date(rangeFrom);
    const to = new Date(rangeTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return 'From/To must be valid.';
    if (to <= from) return 'To must be after From.';
    return null;
  }

  async function refreshSchedule() {
    if (!branchId) return setError('Select a branch to view schedule.');

    const rangeErr = validateRangeTimes();
    if (rangeErr) return setError(rangeErr);

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const fromIso = new Date(rangeFrom).toISOString();
      const toIso = new Date(rangeTo).toISOString();
      const data = await getScheduleRange({ from: fromIso, to: toIso, branchId });
      setSchedule(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }

  async function setRangeAndRefresh(from: Date, to: Date) {
    setRangeFrom(toLocalDateTimeInputValue(from));
    setRangeTo(toLocalDateTimeInputValue(to));
    // allow state to update before calling refreshSchedule with the new values
    setTimeout(() => {
      refreshSchedule();
    }, 0);
  }

  async function onQuickToday() {
    const now = new Date();
    await setRangeAndRefresh(startOfDayLocal(now), endOfDayLocal(now));
  }

  async function onQuickTomorrow() {
    const d = addMinutes(startOfDayLocal(new Date()), 24 * 60); // tomorrow at 00:00 local
    await setRangeAndRefresh(startOfDayLocal(d), endOfDayLocal(d));
  }

  async function onQuickNext7() {
    const now = new Date();
    const from = startOfDayLocal(now);
    const to = endOfDayLocal(addMinutes(from, 7 * 24 * 60));
    await setRangeAndRefresh(from, to);
  }

  async function onCreateShift() {
    if (!branchId) return setError('Select a branch.');
    if (!hasPatients) return setError('No patients in this branch yet — create one in Patients page.');
    if (!patientId) return setError('Select a patient.');

    const timeErr = validateCreateTimes();
    if (timeErr) return setError(timeErr);

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        type,
        priority,
        notes: notes.trim() ? notes.trim() : undefined,
        patientId,
        hospitalId: hospitalId ? hospitalId : null,
      };

      await createShift(branchId, payload);

      // ✅ Form reset after successful create:
      setNotes('');
      // Keep startTime as-is; set endTime = startTime + 30 mins
      const st = new Date(startTime);
      setEndTime(toLocalDateTimeInputValue(addMinutes(st, 30)));

      setMessage('Shift created.');
      await refreshSchedule();
    } catch (e: any) {
      setError(e.message || 'Failed to create shift');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 980 }}>
      <h2>Shifts (Appointments)</h2>

      {error ? (
        <div style={{ background: '#ffe5e5', padding: 10, marginBottom: 12 }}>
          <b>Error:</b> {error}
        </div>
      ) : null}

      {message ? (
        <div style={{ background: '#e7ffe5', padding: 10, marginBottom: 12 }}>
          {message}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Create shift */}
        <div style={{ border: '1px solid #ddd', padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Create shift</h3>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Branch
            <select
              style={{ display: 'block', width: '100%', marginTop: 4 }}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {selectedBranch ? <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{selectedBranch.address}</div> : null}
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Patient
            <select
              style={{ display: 'block', width: '100%', marginTop: 4 }}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={!hasPatients}
            >
              {hasPatients ? null : <option value="">(none)</option>}
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>

            {/* ✅ Fail gracefully when no patients */}
            {!hasPatients ? (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                No patients in this branch yet — create one in Patients page.
              </div>
            ) : selectedPatient ? (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                Selected: {selectedPatient.firstName} {selectedPatient.lastName}
              </div>
            ) : null}
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Hospital (optional)
            <select
              style={{ display: 'block', width: '100%', marginTop: 4 }}
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              <option value="">(none)</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {selectedHospital ? <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{selectedHospital.address}</div> : null}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Type
              <select
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                value={type}
                onChange={(e) => setType(e.target.value as MeetingType)}
              >
                <option value="PHYSICAL">PHYSICAL</option>
                <option value="VIRTUAL">VIRTUAL</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: 8 }}>
              Priority
              <select
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Start time
              <input
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                type="datetime-local"
                value={startTime}
                onChange={(e) => {
                  const next = e.target.value;
                  setStartTime(next);
                  // keep endTime roughly aligned if end <= start after change
                  const st = new Date(next);
                  const et = new Date(endTime);
                  if (!isNaN(st.getTime()) && !isNaN(et.getTime()) && et <= st) {
                    setEndTime(toLocalDateTimeInputValue(addMinutes(st, 30)));
                  }
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 8 }}>
              End time
              <input
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Notes
            <textarea
              style={{ display: 'block', width: '100%', marginTop: 4, minHeight: 80 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </label>

          <button
            disabled={loading || !branchId || !hasPatients || !patientId}
            onClick={onCreateShift}
            style={{ padding: '8px 12px' }}
          >
            {loading ? 'Working…' : 'Create shift'}
          </button>
        </div>

        {/* Schedule range */}
        <div style={{ border: '1px solid #ddd', padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Schedule range</h3>

          {/* ✅ Quick range buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <button disabled={loading || !branchId} onClick={onQuickToday} style={{ padding: '6px 10px' }}>
              Today
            </button>
            <button disabled={loading || !branchId} onClick={onQuickTomorrow} style={{ padding: '6px 10px' }}>
              Tomorrow
            </button>
            <button disabled={loading || !branchId} onClick={onQuickNext7} style={{ padding: '6px 10px' }}>
              Next 7 days
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              From
              <input
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                type="datetime-local"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 8 }}>
              To
              <input
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                type="datetime-local"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
              />
            </label>
          </div>

          <button disabled={loading || !branchId} onClick={refreshSchedule} style={{ padding: '8px 12px' }}>
            {loading ? 'Loading…' : 'Load schedule'}
          </button>

          <div style={{ marginTop: 12 }}>
            <h4 style={{ marginBottom: 8 }}>Results</h4>

            {schedule.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No shifts in range.</div>
            ) : (
              <div style={{ borderTop: '1px solid #eee' }}>
                {schedule.map((s) => {
                  const branchName = s.branch?.name || selectedBranch?.name || s.branchId;
                  const patientName = s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : s.patientId;
                  const hospitalName = s.hospital ? s.hospital.name : s.hospitalId ? s.hospitalId : '(none)';
                  const isUrgent = s.priority === 'URGENT';

                  return (
                    <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                      {/* ✅ Better schedule rows + urgent badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700 }}>{patientName}</div>

                        {isUrgent ? (
                          <span
                            style={{
                              fontSize: 12,
                              padding: '2px 8px',
                              border: '1px solid #d33',
                              borderRadius: 999,
                              color: '#d33',
                              fontWeight: 700,
                            }}
                          >
                            URGENT
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              padding: '2px 8px',
                              border: '1px solid #bbb',
                              borderRadius: 999,
                              opacity: 0.8,
                            }}
                          >
                            NORMAL
                          </span>
                        )}

                        <span style={{ fontSize: 12, padding: '2px 8px', border: '1px solid #bbb', borderRadius: 999, opacity: 0.8 }}>
                          {s.type}
                        </span>

                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          Branch: <b>{branchName}</b>
                        </div>
                      </div>

                      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                        {new Date(s.startTime).toLocaleString()} → {new Date(s.endTime).toLocaleString()}
                      </div>

                      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Hospital: {hospitalName}</div>

                      {s.notes ? (
                        <div style={{ fontSize: 13, marginTop: 6, whiteSpace: 'pre-wrap' }}>{s.notes}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}