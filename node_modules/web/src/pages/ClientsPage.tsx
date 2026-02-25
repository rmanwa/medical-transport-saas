import { useEffect, useState } from 'react';
import { createPatient, getBranches, getPatients } from '../api';
import type { Branch, Patient } from '../api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal, ModalActions } from '../ui/Modal';
import { useToast } from '../ui/Toast';

// Icons
const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export function ClientsPage() {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [clients, setClients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');

  async function loadBranches() {
    try {
      const b = await getBranches();
      setBranches(b);
      if (!branchId && b.length) setBranchId(b[0].id);
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to load branches', 'error');
    }
  }

  async function loadClients(bid: string) {
    setLoading(true);
    try {
      const p = await getPatients(bid);
      setClients(p);
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (branchId) loadClients(branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  async function onCreate() {
    if (!firstName.trim()) {
      showToast('First name is required', 'error');
      return;
    }
    if (!lastName.trim()) {
      showToast('Last name is required', 'error');
      return;
    }
    if (!gender) {
      showToast('Gender is required', 'error');
      return;
    }
    if (!dob) {
      showToast('Date of birth is required', 'error');
      return;
    }

    setLoading(true);
    try {
      await createPatient(branchId, { 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        gender, 
        dateOfBirth: new Date(dob).toISOString() 
      });
      showToast('Client created successfully!', 'success');
      setFirstName('');
      setLastName('');
      setGender('');
      setDob('');
      setCreateOpen(false);
      await loadClients(branchId);
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to create client', 'error');
    } finally {
      setLoading(false);
    }
  }

  const selectedBranch = branches.find(b => b.id === branchId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage client records for each branch
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon />}
          onClick={() => setCreateOpen(true)}
          disabled={!branchId}
        >
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <UserIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
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
              <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Branches</p>
              <p className="text-2xl font-bold text-slate-900">{branches.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">This Month</p>
              <p className="text-2xl font-bold text-slate-900">+{Math.floor(clients.length / 4)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Branch Selector */}
      <Card>
        <CardHeader title="Select Branch" />
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select
                label="Branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loading}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
              {selectedBranch && (
                <p className="mt-2 text-sm text-slate-600">{selectedBranch.address}</p>
              )}
            </div>
            <Button
              variant="ghost"
              icon={<RefreshIcon />}
              onClick={() => branchId && loadClients(branchId)}
              disabled={loading || !branchId}
            >
              Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader
          title={`Clients (${clients.length})`}
          subtitle={selectedBranch ? `at ${selectedBranch.name}` : undefined}
        />
        <CardBody>
          {loading && clients.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 p-4">
                <UserIcon />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">
                No clients in this branch yet
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                Add your first client
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <UserIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">
                          {p.firstName} {p.lastName}
                        </h4>
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <CalendarIcon />
                          {new Date(p.dateOfBirth).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{p.gender}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{p.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Client Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add New Client"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              placeholder="e.g., John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              leftIcon={<UserIcon />}
            />

            <Input
              label="Last Name"
              placeholder="e.g., Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              leftIcon={<UserIcon />}
            />
          </div>

          <Select
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select gender...</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </Select>

          <Input
            type="date"
            label="Date of Birth"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            leftIcon={<CalendarIcon />}
          />

          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Client will be added to {selectedBranch?.name}.</span>
          </div>
        </div>

        <div className="mt-6">
          <ModalActions
            onCancel={() => setCreateOpen(false)}
            onConfirm={onCreate}
            cancelLabel="Cancel"
            confirmLabel="Add Client"
            loading={loading}
          />
        </div>
      </Modal>
    </div>
  );
}