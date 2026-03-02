import { useEffect, useMemo, useState } from 'react';
import { getBranches, getStaff, inviteStaff, updateStaff, updateStaffBranches, deleteStaff } from '../api';
import type { Branch, StaffMember } from '../api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalActions } from '../ui/Modal';
import { useToast } from '../ui/Toast';

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BranchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export function StaffPage() {
  const { showToast } = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPassword, setInvPassword] = useState('');
  const [invBranchIds, setInvBranchIds] = useState<string[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Branch assignment modal
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchStaffId, setBranchStaffId] = useState('');
  const [branchStaffName, setBranchStaffName] = useState('');
  const [branchSelectedIds, setBranchSelectedIds] = useState<string[]>([]);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteName, setDeleteName] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return staff;
    return staff.filter(
      (s) => (s.name + ' ' + s.email).toLowerCase().includes(needle),
    );
  }, [staff, q]);

  const adminCount = useMemo(() => staff.filter((s) => s.role === 'SUPER_ADMIN').length, [staff]);
  const staffCount = useMemo(() => staff.filter((s) => s.role === 'STAFF').length, [staff]);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const [s, b] = await Promise.all([getStaff(), getBranches()]);
      setStaff(s);
      setBranches(b);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load staff');
      showToast(e?.message ?? 'Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Invite ─────────────────────────────────────────────────────────

  function openInvite() {
    setInvName('');
    setInvEmail('');
    setInvPassword('');
    setInvBranchIds([]);
    setError('');
    setInviteOpen(true);
  }

  function toggleInvBranch(id: string) {
    setInvBranchIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  }

  async function onInvite() {
    if (!invName.trim()) { setError('Name is required'); return; }
    if (!invEmail.trim() || !invEmail.includes('@')) { setError('A valid email is required'); return; }
    if (invPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (invBranchIds.length === 0) { setError('Select at least one branch'); return; }

    setLoading(true);
    setError('');
    try {
      await inviteStaff({
        name: invName.trim(),
        email: invEmail.trim(),
        password: invPassword,
        branchIds: invBranchIds,
      });
      setInviteOpen(false);
      showToast('Staff member invited successfully', 'success');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to invite staff');
      showToast(e?.message ?? 'Failed to invite staff', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Edit ───────────────────────────────────────────────────────────

  function openEdit(s: StaffMember) {
    setEditId(s.id);
    setEditName(s.name);
    setEditEmail(s.email);
    setError('');
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editName.trim()) { setError('Name is required'); return; }
    if (!editEmail.trim() || !editEmail.includes('@')) { setError('A valid email is required'); return; }

    setLoading(true);
    setError('');
    try {
      await updateStaff(editId, { name: editName.trim(), email: editEmail.trim() });
      setEditOpen(false);
      showToast('Staff member updated', 'success');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update staff');
      showToast(e?.message ?? 'Failed to update staff', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Branch Assignment ──────────────────────────────────────────────

  function openBranches(s: StaffMember) {
    setBranchStaffId(s.id);
    setBranchStaffName(s.name);
    setBranchSelectedIds(s.branches.map((b) => b.id));
    setError('');
    setBranchOpen(true);
  }

  function toggleBranch(id: string) {
    setBranchSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  }

  async function onSaveBranches() {
    if (branchSelectedIds.length === 0) { setError('Select at least one branch'); return; }

    setLoading(true);
    setError('');
    try {
      await updateStaffBranches(branchStaffId, branchSelectedIds);
      setBranchOpen(false);
      showToast('Branch assignments updated', 'success');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update branches');
      showToast(e?.message ?? 'Failed to update branches', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────

  function openDelete(s: StaffMember) {
    setDeleteId(s.id);
    setDeleteName(s.name);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    setLoading(true);
    setError('');
    try {
      await deleteStaff(deleteId);
      setDeleteOpen(false);
      showToast('Staff member removed', 'success');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove staff');
      showToast(e?.message ?? 'Failed to remove staff', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Branch Picker (shared by invite + reassign) ────────────────────

  function BranchPicker({
    selected,
    onToggle,
  }: {
    selected: string[];
    onToggle: (id: string) => void;
  }) {
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Assign to Branches
        </label>
        {branches.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No branches available</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {branches.map((b) => {
              const checked = selected.includes(b.id);
              return (
                <label
                  key={b.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(b.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{b.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{b.address}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Invite team members and manage their branch access
          </p>
        </div>
        <Button variant="primary" icon={<PlusIcon />} onClick={openInvite}>
          Invite Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
              <UsersIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Members</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{staff.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-3 text-purple-600 dark:text-purple-400">
              <ShieldIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Admins</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{adminCount}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
              <UserIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Staff</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{staffCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader title="Search Staff" />
        <CardBody>
          <Input
            placeholder="Search by name or email..."
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
            leftIcon={<SearchIcon />}
          />
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader
          title={`All Staff (${filtered.length})`}
          right={
            <Button variant="ghost" size="sm" icon={<RefreshIcon />} onClick={refresh} disabled={loading}>
              Refresh
            </Button>
          }
        />
        <CardBody>
          {loading && staff.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 dark:bg-slate-700 p-4 text-slate-400 dark:text-slate-500">
                <UsersIcon />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                {q ? 'No staff found matching your search' : 'No team members yet'}
              </p>
              {!q && (
                <Button variant="ghost" size="sm" className="mt-4" onClick={openInvite}>
                  Invite your first team member
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Branches</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((s, idx) => (
                    <tr
                      key={s.id}
                      className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/40 dark:bg-slate-700/20'
                      }`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-slate-400 dark:text-slate-500">
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            <UserIcon />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.email}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            s.role === 'SUPER_ADMIN'
                              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {s.role === 'SUPER_ADMIN' ? 'Admin' : 'Staff'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {s.canAccessAllBranches ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                            All Branches
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {s.branches.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                              >
                                {b.name}
                              </span>
                            ))}
                            {s.branches.length === 0 && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">None</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" icon={<EditIcon />} onClick={() => openEdit(s)} disabled={loading}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" icon={<BranchIcon />} onClick={() => openBranches(s)} disabled={loading}>
                            Branches
                          </Button>
                          {s.role !== 'SUPER_ADMIN' && (
                            <Button variant="danger" size="sm" icon={<TrashIcon />} onClick={() => openDelete(s)} disabled={loading}>
                              Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Invite Modal ── */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff Member" size="md">
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g., Jane Doe"
            value={invName}
            onChange={(e: any) => setInvName(e.target.value)}
            required
            leftIcon={<UserIcon />}
          />

          <Input
            label="Email"
            placeholder="jane@clinic.com"
            value={invEmail}
            onChange={(e: any) => setInvEmail(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Temporary Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={invPassword}
              onChange={(e) => setInvPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Share this with the staff member. They should change it after first login.
            </p>
          </div>

          <BranchPicker selected={invBranchIds} onToggle={toggleInvBranch} />
        </div>
        <div className="mt-6">
          <ModalActions
            onCancel={() => setInviteOpen(false)}
            onConfirm={onInvite}
            cancelLabel="Cancel"
            confirmLabel="Send Invite"
            loading={loading}
          />
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Staff Member" size="md">
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            value={editName}
            onChange={(e: any) => setEditName(e.target.value)}
            required
            leftIcon={<UserIcon />}
          />

          <Input
            label="Email"
            value={editEmail}
            onChange={(e: any) => setEditEmail(e.target.value)}
            required
          />
        </div>
        <div className="mt-6">
          <ModalActions
            onCancel={() => setEditOpen(false)}
            onConfirm={onSaveEdit}
            cancelLabel="Cancel"
            confirmLabel="Save Changes"
            loading={loading}
          />
        </div>
      </Modal>

      {/* ── Branch Assignment Modal ── */}
      <Modal open={branchOpen} onClose={() => setBranchOpen(false)} title={`Branches for ${branchStaffName}`} size="md">
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-300">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>This will replace all current branch assignments for this staff member.</span>
          </div>

          <BranchPicker selected={branchSelectedIds} onToggle={toggleBranch} />
        </div>
        <div className="mt-6">
          <ModalActions
            onCancel={() => setBranchOpen(false)}
            onConfirm={onSaveBranches}
            cancelLabel="Cancel"
            confirmLabel="Save Branches"
            loading={loading}
          />
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Staff Member" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <svg className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-bold text-red-900 dark:text-red-300">Warning</h4>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                Are you sure you want to remove <strong>{deleteName}</strong>? They will lose access to the system immediately.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <ModalActions
            onCancel={() => setDeleteOpen(false)}
            onConfirm={onConfirmDelete}
            cancelLabel="Cancel"
            confirmLabel="Remove Staff"
            loading={loading}
            variant="danger"
          />
        </div>
      </Modal>
    </div>
  );
}