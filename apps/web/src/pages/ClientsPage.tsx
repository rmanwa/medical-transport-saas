import { useEffect, useState } from 'react';
import { createPatient, updatePatient, deletePatient, getBranches, getPatients, toMMDDYYYY } from '../api';
import type { AuthUser, Branch, Patient } from '../api';
import { useToast } from '../ui/Toast';

const UserIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const CalendarIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const PlusIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const RefreshIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>);
const EditIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
const TrashIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const WarnIcon = () => (<svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);
const MailIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);

const inputCls = "w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition";
const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
const selectCls = `${inputCls} cursor-pointer`;

// Minimal self-contained Modal
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">✕</button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, cancelLabel, confirmLabel, loading, danger }: {
  onCancel: () => void; onConfirm: () => void; cancelLabel: string; confirmLabel: string; loading?: boolean; danger?: boolean;
}) {
  return (
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition">
        {cancelLabel}
      </button>
      <button onClick={onConfirm} disabled={loading}
        className={`h-10 px-4 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
        {loading ? 'Saving…' : confirmLabel}
      </button>
    </div>
  );
}

interface ClientsPageProps { user: AuthUser; }

export function ClientsPage({ user }: ClientsPageProps) {
  const { showToast } = useToast();
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canSwitchBranch = user.role === 'SUPER_ADMIN' || user.canAccessAllBranches;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [clients, setClients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');           // ← NEW

  // Edit form
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editEmail, setEditEmail] = useState('');   // ← NEW

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteName, setDeleteName] = useState('');

  function scopeBranches(all: Branch[]) {
    return canSwitchBranch ? all : all.filter((b) => user.branchIds.includes(b.id));
  }

  async function loadBranches() {
    try {
      const all = await getBranches();
      const scoped = scopeBranches(all);
      setBranches(scoped);
      if (!branchId && scoped.length > 0) setBranchId(scoped[0].id);
    } catch (e: any) { showToast(e?.message ?? 'Failed to load branches', 'error'); }
  }

  async function loadClients(bid: string) {
    setLoading(true);
    try { setClients(await getPatients(bid)); }
    catch (e: any) { showToast(e?.message ?? 'Failed to load clients', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadBranches(); }, []);
  useEffect(() => { if (branchId) loadClients(branchId); }, [branchId]);

  async function onCreate() {
    if (!firstName.trim() || !lastName.trim() || !gender || !dob) { showToast('All fields are required', 'error'); return; }
    setLoading(true);
    try {
      await createPatient(branchId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dateOfBirth: new Date(dob).toISOString(),
        email: email.trim() || undefined,  // ← NEW: pass email
      });
      showToast('Client created!', 'success');
      setFirstName(''); setLastName(''); setGender(''); setDob(''); setEmail('');
      setCreateOpen(false);
      await loadClients(branchId);
    } catch (e: any) { showToast(e?.message ?? 'Failed', 'error'); }
    finally { setLoading(false); }
  }

  function openEdit(p: Patient) {
    setEditId(p.id); setEditFirstName(p.firstName); setEditLastName(p.lastName);
    setEditGender(p.gender); setEditDob(p.dateOfBirth.slice(0, 10));
    setEditEmail(p.email ?? '');   // ← NEW
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editFirstName.trim() || !editLastName.trim() || !editGender || !editDob) { showToast('All fields are required', 'error'); return; }
    setLoading(true);
    try {
      await updatePatient(branchId, editId, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        gender: editGender,
        dateOfBirth: new Date(editDob).toISOString(),
        email: editEmail.trim() || undefined,  // ← NEW
      });
      showToast('Client updated!', 'success'); setEditOpen(false); await loadClients(branchId);
    } catch (e: any) { showToast(e?.message ?? 'Failed', 'error'); }
    finally { setLoading(false); }
  }

  function openDelete(p: Patient) { setDeleteId(p.id); setDeleteName(`${p.firstName} ${p.lastName}`); setDeleteOpen(true); }

  async function onConfirmDelete() {
    setLoading(true);
    try {
      await deletePatient(branchId, deleteId);
      showToast('Client deleted', 'success'); setDeleteOpen(false); await loadClients(branchId);
    } catch (e: any) { showToast(e?.message ?? 'Failed', 'error'); }
    finally { setLoading(false); }
  }

  const selectedBranch = branches.find((b) => b.id === branchId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage client records for each branch</p>
        </div>
        <button onClick={() => setCreateOpen(true)} disabled={!branchId}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50">
          <PlusIcon /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Clients', value: clients.length, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
          { label: canSwitchBranch ? 'Total Branches' : 'My Branches', value: branches.length, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
          { label: 'Active', value: clients.length, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-3 ${s.bg} ${s.text}`}><UserIcon /></div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch selector */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Branch</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            {canSwitchBranch ? (
              <div>
                <label className={labelCls}>Select Branch</label>
                <select className={selectCls} value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={loading}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            ) : branches.length === 1 ? (
              <div>
                <label className={labelCls}>Your Assigned Branch</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 h-11">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{branches[0].name}</span>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 italic">locked</span>
                </div>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Your Assigned Branch</label>
                <select className={selectCls} value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={loading}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {selectedBranch && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{selectedBranch.address}</p>}
          </div>
          <button onClick={() => branchId && loadClients(branchId)} disabled={loading || !branchId}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition disabled:opacity-50">
            <RefreshIcon /> Refresh
          </button>
        </div>
      </div>

      {/* Clients table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Clients ({clients.length})
            {selectedBranch && <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">at {selectedBranch.name}</span>}
          </h3>
        </div>
        {loading && clients.length === 0 ? (
          <div className="p-4 space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)}</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-slate-100 dark:bg-slate-700 p-4 text-slate-400 dark:text-slate-500"><UserIcon /></div>
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">No clients in this branch yet</p>
            <button onClick={() => setCreateOpen(true)} className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Add your first client</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Client Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>  {/* ← NEW */}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date of Birth</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Branch</th>
                  {isSuperAdmin && <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {clients.map((p, idx) => (
                  <tr key={p.id} className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/20'}`}>
                    <td className="px-5 py-3 text-xs font-mono text-slate-400 dark:text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{p.firstName} {p.lastName}</span>
                      </div>
                    </td>
                    {/* ← NEW: Email column */}
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {p.email ? (
                        <div className="flex items-center gap-1.5">
                          <MailIcon />
                          <span className="truncate max-w-[180px]">{p.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5"><CalendarIcon />{toMMDDYYYY(p.dateOfBirth)}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{selectedBranch?.name ?? '—'}</td>
                    {isSuperAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)} disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition disabled:opacity-50">
                            <EditIcon /> Edit
                          </button>
                          <button onClick={() => openDelete(p)} disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800/60 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50">
                            <TrashIcon /> Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Client">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>First Name *</label><input className={inputCls} placeholder="e.g. John" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div><label className={labelCls}>Last Name *</label><input className={inputCls} placeholder="e.g. Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          {/* ← NEW: Email field */}
          <div>
            <label className={labelCls}>Email <span className="text-slate-400 font-normal">(optional — used for appointment notifications)</span></label>
            <input type="email" className={inputCls} placeholder="e.g. john.doe@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Gender *</label>
            <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender…</option>
              <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date of Birth *</label>
            <input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-300">
            Client will be added to <strong>{selectedBranch?.name}</strong>.
            {email.trim() && ' They will receive email notifications when appointments are scheduled.'}
          </div>
          <ModalActions onCancel={() => setCreateOpen(false)} onConfirm={onCreate} cancelLabel="Cancel" confirmLabel="Add Client" loading={loading} />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Client">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>First Name *</label><input className={inputCls} value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} /></div>
            <div><label className={labelCls}>Last Name *</label><input className={inputCls} value={editLastName} onChange={(e) => setEditLastName(e.target.value)} /></div>
          </div>
          {/* ← NEW: Email field */}
          <div>
            <label className={labelCls}>Email <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="email" className={inputCls} placeholder="e.g. john.doe@email.com" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Gender *</label>
            <select className={selectCls} value={editGender} onChange={(e) => setEditGender(e.target.value)}>
              <option value="">Select gender…</option>
              <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date of Birth *</label>
            <input type="date" className={inputCls} value={editDob} onChange={(e) => setEditDob(e.target.value)} />
          </div>
          <ModalActions onCancel={() => setEditOpen(false)} onConfirm={onSaveEdit} cancelLabel="Cancel" confirmLabel="Save Changes" loading={loading} />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Client">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-300">
            <WarnIcon />
            <div>
              <p className="font-bold">Warning</p>
              <p className="mt-1 text-sm">Are you sure you want to delete <strong>{deleteName}</strong>? This cannot be undone.</p>
            </div>
          </div>
          <ModalActions onCancel={() => setDeleteOpen(false)} onConfirm={onConfirmDelete} cancelLabel="Cancel" confirmLabel="Delete Client" loading={loading} danger />
        </div>
      </Modal>
    </div>
  );
}