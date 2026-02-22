import { useEffect, useMemo, useState } from 'react';
import { createHospital, deleteHospital, getHospitals, updateHospital } from '../api';
import type { AuthUser, Hospital } from '../api';

const COLORS = {
  bg: '#f7f7f8',
  card: '#ffffff',
  text: '#0f172a', // primary text
  muted: '#475569', // secondary text
  faint: '#64748b', // hints
  border: '#e5e7eb',
};

function Card(props: { title: string; children: any; right?: any }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 14,
        background: COLORS.card,
        color: COLORS.text,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 800, color: COLORS.text }}>{props.title}</div>
        <div style={{ marginLeft: 'auto' }}>{props.right}</div>
      </div>
      {props.children}
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={{
          width: '100%',
          padding: '10px 10px',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          outline: 'none',
          color: COLORS.text,
          background: '#fff',
        }}
      />
    </label>
  );
}

function Button(props: { children: any; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger' }) {
  const v = props.variant ?? 'primary';
  const base: any = {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    opacity: props.disabled ? 0.6 : 1,
    color: COLORS.text,
    background: '#fff',
    borderColor: COLORS.border,
  };

  if (v === 'primary') Object.assign(base, { background: '#111827', color: '#fff', borderColor: '#111827' });
  if (v === 'ghost') Object.assign(base, { background: '#fff', color: COLORS.text, borderColor: COLORS.border });
  if (v === 'danger') Object.assign(base, { background: '#fff', color: '#b00020', borderColor: '#f1c1c7' });

  return (
    <button style={base} disabled={props.disabled} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

function Modal(props: { title: string; open: boolean; onClose: () => void; children: any }) {
  if (!props.open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50,
      }}
      onMouseDown={props.onClose}
    >
      <div
        style={{
          width: 560,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 14,
          padding: 14,
          border: '1px solid #eee',
          color: COLORS.text,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 800 }}>{props.title}</div>
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="ghost" onClick={props.onClose}>
              Close
            </Button>
          </div>
        </div>
        {props.children}
      </div>
    </div>
  );
}

export function HospitalsPage(props: { me: AuthUser }) {
  const canManage = props.me.role === 'SUPER_ADMIN';

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
    if (!canManage) return setError('Forbidden: managers only.');

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
    if (!canManage) return;
    setEditId(h.id);
    setEditName(h.name);
    setEditAddress(h.address);
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!canManage) return setError('Forbidden: managers only.');

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
    if (!canManage) return setError('Forbidden: managers only.');

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
    <div
      style={{
        padding: 16,
        maxWidth: 1100,
        background: COLORS.bg,
        minHeight: 'calc(100vh - 60px)',
        color: COLORS.text,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: COLORS.text }}>Hospitals</h2>
        <div style={{ color: COLORS.muted, fontSize: 13 }}>Manage clinic / hospital destinations (company-wide)</div>
        <div className="p-4 text-2xl font-bold">Tailwind is working</div>
      </div>

      {toast ? (
        <div
          style={{
            background: '#111827',
            color: '#fff',
            padding: '10px 12px',
            borderRadius: 12,
            marginBottom: 12,
            width: 'fit-content',
          }}
        >
          {toast}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            background: '#ffe8e8',
            border: '1px solid #f3bcbc',
            padding: 10,
            borderRadius: 12,
            marginBottom: 12,
            color: COLORS.text,
          }}
        >
          <b>Error:</b> {error}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: canManage ? '420px 1fr' : '1fr',
          gap: 14,
          alignItems: 'start',
        }}
      >
        {canManage ? (
          <Card
            title="Add hospital"
            right={
              <Button variant="ghost" disabled={loading} onClick={refresh}>
                Refresh
              </Button>
            }
          >
            <Field label="Name" value={name} onChange={setName} placeholder="e.g., Downtown Imaging & Specialty" />
            <Field label="Address" value={address} onChange={setAddress} placeholder="e.g., 77 W Monroe St, Chicago, IL" />

            <div style={{ display: 'flex', gap: 10 }}>
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

            <div style={{ marginTop: 10, fontSize: 12, color: COLORS.faint }}>
              Tip: These are shared across all branches within the company.
            </div>
          </Card>
        ) : null}

        <Card
          title={`All hospitals (${filtered.length})`}
          right={
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              style={{
                padding: '9px 10px',
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                width: 260,
                color: COLORS.text,
                background: '#fff',
                outline: 'none',
              }}
            />
          }
        >
          {!canManage ? (
            <div style={{ marginBottom: 10, fontSize: 12, color: COLORS.muted }}>
              Read-only: ask a manager to add or edit hospital destinations.
            </div>
          ) : null}

          {loading && rows.length === 0 ? (
            <div style={{ opacity: 0.7, color: COLORS.muted }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ opacity: 0.7, color: COLORS.muted }}>No hospitals yet.</div>
          ) : (
            <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
              {filtered.map((h) => (
                <div
                  key={h.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: COLORS.text }}>{h.name}</div>
                    <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{h.address}</div>
                  </div>

                  {canManage ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Button variant="ghost" disabled={loading} onClick={() => openEdit(h)}>
                        Edit
                      </Button>
                      <Button variant="danger" disabled={loading} onClick={() => onDelete(h.id)}>
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {canManage ? (
        <Modal title="Edit hospital" open={editOpen} onClose={() => setEditOpen(false)}>
          <Field label="Name" value={editName} onChange={setEditName} />
          <Field label="Address" value={editAddress} onChange={setEditAddress} />

          <div style={{ display: 'flex', gap: 10 }}>
            <Button disabled={loading} onClick={onSaveEdit}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="ghost" disabled={loading} onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}