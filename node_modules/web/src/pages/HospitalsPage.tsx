import { useEffect, useMemo, useState } from 'react';
import { createHospital, deleteHospital, getHospitals, updateHospital } from '../api';
import type { Hospital } from '../api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalActions } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

// Icons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const LocationIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

export function HospitalsPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const [deleteName, setDeleteName] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((h) => (h.name + ' ' + h.address).toLowerCase().includes(needle));
  }, [rows, q]);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await getHospitals();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load hospitals');
      showToast(e?.message ?? 'Failed to load hospitals', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate() {
    const n = name.trim();
    const a = address.trim();
    if (!n) {
      setError('Hospital name is required.');
      return;
    }
    if (!a) {
      setError('Hospital address is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createHospital({ name: n, address: a });
      setName('');
      setAddress('');
      setCreateOpen(false);
      showToast('Hospital added successfully', 'success');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create hospital');
      showToast(e?.message ?? 'Failed to create hospital', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(h: Hospital) {
    setEditId(h.id);
    setEditName(h.name);
    setEditAddress(h.address);
    setEditOpen(true);
  }

  async function onSaveEdit() {
    const n = editName.trim();
    const a = editAddress.trim();
    if (!n) {
      setError('Hospital name is required.');
      return;
    }
    if (!a) {
      setError('Hospital address is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateHospital(editId, { name: n, address: a });
      setEditOpen(false);
      showToast('Changes saved successfully', 'success');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update hospital');
      showToast(e?.message ?? 'Failed to update hospital', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openDelete(h: Hospital) {
    setDeleteId(h.id);
    setDeleteName(h.name);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    setLoading(true);
    setError('');
    try {
      await deleteHospital(deleteId);
      setDeleteOpen(false);
      showToast('Hospital deleted', 'success');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete hospital');
      showToast(e?.message ?? 'Failed to delete hospital', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hospitals</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage clinic and hospital destinations across all branches
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Add Hospital
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <BuildingIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Hospitals</p>
              <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active</p>
              <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <LocationIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Locations</p>
              <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">This Month</p>
              <p className="text-2xl font-bold text-slate-900">+{Math.floor(rows.length / 3)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader title="Search Hospitals" />
        <CardBody>
          <Input
            placeholder="Search by name or address..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<SearchIcon />}
          />
        </CardBody>
      </Card>

      {/* Hospitals List */}
      <Card>
        <CardHeader
          title={`All Hospitals (${filtered.length})`}
          right={
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          }
        />
        <CardBody>
          {loading && rows.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 p-4">
                <BuildingIcon />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">
                {q ? 'No hospitals found matching your search' : 'No hospitals yet'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                Add your first hospital
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((h) => (
                <div
                  key={h.id}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <BuildingIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-bold text-slate-900">{h.name}</h4>
                        <Badge variant="primary" size="sm">
                          Active
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                        <LocationIcon />
                        <span className="truncate">{h.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<EditIcon />}
                      onClick={() => openEdit(h)}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<TrashIcon />}
                      onClick={() => openDelete(h)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add New Hospital"
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Input
            label="Hospital Name"
            placeholder="e.g., Downtown Medical Center"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            leftIcon={<BuildingIcon />}
          />

          <Input
            label="Address"
            placeholder="e.g., 123 Main St, Chicago, IL 60601"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            leftIcon={<LocationIcon />}
          />

          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>This hospital will be available to all branches in your company.</span>
          </div>
        </div>

        <div className="mt-6">
          <ModalActions
            onCancel={() => setCreateOpen(false)}
            onConfirm={onCreate}
            cancelLabel="Cancel"
            confirmLabel="Add Hospital"
            loading={loading}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Hospital"
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Input
            label="Hospital Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            leftIcon={<BuildingIcon />}
          />

          <Input
            label="Address"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
            required
            leftIcon={<LocationIcon />}
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Hospital"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <svg className="h-6 w-6 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-bold text-red-900">Warning</h4>
              <p className="mt-1 text-sm text-red-800">
                Are you sure you want to delete <strong>{deleteName}</strong>? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ModalActions
            onCancel={() => setDeleteOpen(false)}
            onConfirm={onConfirmDelete}
            cancelLabel="Cancel"
            confirmLabel="Delete Hospital"
            loading={loading}
            variant="danger"
          />
        </div>
      </Modal>
    </div>
  );
}