import { useEffect, useState } from 'react';
import { getBranches } from '../api';
import type { AuthUser, Branch } from '../api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ClinicIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v4m-2-2h4" />
  </svg>
);

const LocationIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClinicsPageProps {
  user: AuthUser;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClinicsPage({ user }: ClinicsPageProps) {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canSeeAll = isSuperAdmin || user.canAccessAllBranches;

  function scopeBranches(all: Branch[]): Branch[] {
    if (canSeeAll) return all;
    return all.filter((b) => user.branchIds.includes(b.id));
  }

  async function load() {
    setLoading(true);
    try {
      const all = await getBranches();
      setBranches(scopeBranches(all));
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to load clinics', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clinics</h1>
          <p className="mt-1 text-sm text-slate-600">
            {canSeeAll
              ? 'All clinic branches across the organisation'
              : `Your assigned clinic${branches.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="ghost" icon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Summary stat */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600"><ClinicIcon /></div>
            <div>
              <p className="text-sm font-medium text-slate-600">
                {canSeeAll ? 'Total Clinics' : 'My Clinics'}
              </p>
              <p className="text-2xl font-bold text-slate-900">{branches.length}</p>
            </div>
          </div>
        </Card>

        {isSuperAdmin && (
          <>
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-3 text-green-600"><BuildingIcon /></div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-900">{branches.length}</p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3 text-purple-600"><LocationIcon /></div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Locations</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Set(branches.map((b) => b.address.split(',').slice(-1)[0].trim())).size}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Clinics table */}
      <Card>
        <CardHeader title={`Clinics (${branches.length})`} />
        <CardBody>
          {loading && branches.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 p-4"><ClinicIcon /></div>
              <p className="mt-4 text-sm font-medium text-slate-600">No clinics found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Clinic Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    {/* Branch ID shown to admins for reference */}
                    {isSuperAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Branch ID
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {branches.map((b, idx) => {
                    const isAssigned = user.branchIds.includes(b.id);
                    return (
                      <tr
                        key={b.id}
                        className={`transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                      >
                        {/* Row number */}
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                          {String(idx + 1).padStart(2, '0')}
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                              <ClinicIcon />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{b.name}</div>
                              {!canSeeAll && isAssigned && (
                                <div className="text-[11px] text-blue-600 font-medium">Your branch</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-1.5 text-slate-600">
                            <LocationIcon />
                            <span className="leading-snug">{b.address}</span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                            Active
                          </span>
                        </td>

                        {/* Branch ID (admin only) */}
                        {isSuperAdmin && (
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">
                            {b.id.slice(0, 12)}…
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}