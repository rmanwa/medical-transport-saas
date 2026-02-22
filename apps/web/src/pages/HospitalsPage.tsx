import { useEffect, useMemo, useState } from 'react';
import { createHospital, deleteHospital, getHospitals, updateHospital } from '../api';
import type { Hospital } from '../api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

function Modal(props: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={props.onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="text-sm font-extrabold text-slate-900">{props.title}</div>
          <div className="ml-auto">
            <Button variant="ghost" onClick={props.onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="px-5 py-4">{props.children}</div>
      </div>
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold text-slate-600">{props.label}</div>
      <Input value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} />
    </label>
  );
}

export function HospitalsPage() {
  const [rows, setRows] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [q, setQ] = useState('');

  // create form
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((h) => (h.name + ' ' + h.address).toLowerCase().includes(needle));
  }, [rows, q]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1600);
  }

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await getHospitals();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    const n = name.trim();
    const a = address.trim();
    if (!n) return setError('Hospital name is required.');
    if (!a) return setError('Hospital address is required.');

    setLoading(true);
    setError('');
    try {
      await createHospital({ name: n, address: a });
      setName('');
      setAddress('');
      showToast('Hospital added');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create hospital');
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
    if (!n) return setError('Hospital name is required.');
    if (!a) return setError('Hospital address is required.');

    setLoading(true);
    setError('');
    try {
      await updateHospital(editId, { name: n, address: a });
      setEditOpen(false);
      showToast('Changes saved');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update hospital');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    const ok = window.confirm('Delete this hospital? This cannot be undone.');
    if (!ok) return;

    setLoading(true);
    setError('');
    try {
      await deleteHospital(id);
      showToast('Hospital deleted');
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete hospital');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-slate-900">Hospitals</h1>
        <div className="text-sm text-slate-600">Manage clinic / hospital destinations (company-wide)</div>
        <div className="p-6 bg-red-500 text-white rounded-xl">Tailwind test</div>
        <div className="p-6 rounded-xl bg-white shadow-sm border border-slate-200">
  <div className="text-slate-900 font-semibold">Tailwind is working</div>
  <div className="text-slate-600 text-sm">If this looks like a card, you’re good.</div>
</div>
      </div>

      {toast ? (
        <div className="w-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">{toast}</div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span className="font-bold">Error:</span> {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card
          title="Add hospital"
          right={
            <Button variant="secondary" disabled={loading} onClick={refresh}>
              Refresh
            </Button>
          }
        >
          <div className="space-y-3">
            <Field label="Name" value={name} onChange={setName} placeholder="e.g., Downtown Imaging & Specialty" />
            <Field label="Address" value={address} onChange={setAddress} placeholder="e.g., 77 W Monroe St, Chicago, IL" />

            <div className="flex flex-wrap gap-2 pt-1">
              <Button disabled={loading} onClick={onCreate}>
                {loading ? 'Working…' : 'Add hospital'}
              </Button>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setName('');
                  setAddress('');
                }}
              >
                Clear
              </Button>
            </div>

            <div className="text-xs text-slate-500">
              Tip: These are shared across all branches within the company.
            </div>
          </div>
        </Card>

        <Card
          title={`All hospitals (${filtered.length})`}
          right={
            <div className="w-72 max-w-full">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
            </div>
          }
        >
          {loading && rows.length === 0 ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-600">No hospitals yet.</div>
          ) : (
            <div className="-mx-5 border-t border-slate-100">
              {filtered.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-slate-900">{h.name}</div>
                    <div className="mt-1 truncate text-sm text-slate-600">{h.address}</div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" disabled={loading} onClick={() => openEdit(h)}>
                      Edit
                    </Button>
                    <Button variant="danger" disabled={loading} onClick={() => onDelete(h.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal title="Edit hospital" open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <Field label="Name" value={editName} onChange={setEditName} />
          <Field label="Address" value={editAddress} onChange={setEditAddress} />

          <div className="flex flex-wrap gap-2 pt-1">
            <Button disabled={loading} onClick={onSaveEdit}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="ghost" disabled={loading} onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}