import { useEffect, useState } from 'react';
import { createPatient, getBranches, getPatients } from '../api';
import type { Branch, Patient } from '../api';

export function PatientsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('Jane');
  const [lastName, setLastName] = useState('Smith');
  const [gender, setGender] = useState('F');
  const [dob, setDob] = useState('1990-06-10T00:00:00.000Z');

  async function loadBranches() {
    const b = await getBranches();
    setBranches(b);
    if (!branchId && b.length) setBranchId(b[0].id);
  }

  async function loadPatients(bid: string) {
    setError('');
    try {
      const p = await getPatients(bid);
      setPatients(p);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    loadBranches().catch((e) => setError(e?.message ?? String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (branchId) loadPatients(branchId);
  }, [branchId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId) return;
    setError('');
    try {
      await createPatient(branchId, { firstName, lastName, gender, dateOfBirth: dob });
      await loadPatients(branchId);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Patients</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Branch:&nbsp;
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => branchId && loadPatients(branchId)}>Refresh</button>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, border: '1px solid #f3b', borderRadius: 10 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <h3 style={{ marginTop: 18 }}>Create Patient</h3>
      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <label>
          First name
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label>
          Last name
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label>
          Gender
          <input value={gender} onChange={(e) => setGender(e.target.value)} />
        </label>
        <label>
          Date of birth (ISO)
          <input value={dob} onChange={(e) => setDob(e.target.value)} />
        </label>
        <button type="submit">Create</button>
      </form>

      <h3 style={{ marginTop: 18 }}>Patients List</h3>
      <div style={{ border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f6f6f6' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Gender</th>
              <th style={{ textAlign: 'left', padding: 8 }}>DOB</th>
              <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 10, opacity: 0.7 }}>
                  No patients.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    {p.firstName} {p.lastName}
                  </td>
                  <td style={{ padding: 8 }}>{p.gender}</td>
                  <td style={{ padding: 8 }}>{new Date(p.dateOfBirth).toLocaleDateString()}</td>
                  <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 12 }}>{p.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
