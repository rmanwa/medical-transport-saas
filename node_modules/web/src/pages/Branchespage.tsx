import { useEffect, useState } from 'react';
import { getBranches } from '../api';
import type { AuthUser, Branch } from '../api';
import { useToast } from '../ui/Toast';

const ClinicIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v4m-2-2h4" /></svg>);
const LocationIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const RefreshIcon = () => (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>);
const BuildingIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>);

interface BranchesPageProps { user: AuthUser; }

export function BranchesPage({ user }: BranchesPageProps) {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canSeeAll = isSuperAdmin || user.canAccessAllBranches;

  function scopeBranches(all: Branch[]) {
    return canSeeAll ? all : all.filter((b) => user.branchIds.includes(b.id));
  }

  async function load() {
    setLoading(true);
    try { setBranches(scopeBranches(await getBranches())); }
    catch (e: any) { showToast(e?.message ?? 'Failed to load branches', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branches</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {canSeeAll ? 'All branches across the organisation' : `Your assigned branch${branches.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition disabled:opacity-50">
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400"><ClinicIcon /></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{canSeeAll ? 'Total Branches' : 'My Branches'}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{branches.length}</p>
            </div>
          </div>
        </div>
        {isSuperAdmin && (
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400"><BuildingIcon /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{branches.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-3 text-purple-600 dark:text-purple-400"><LocationIcon /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Locations</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{new Set(branches.map((b) => b.address.split(',').slice(-1)[0].trim())).size}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Branches ({branches.length})</h3>
        </div>
        {loading && branches.length === 0 ? (
          <div className="p-4 space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />)}</div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-slate-100 dark:bg-slate-700 p-4 text-slate-400 dark:text-slate-500"><ClinicIcon /></div>
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">No branches found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Branch Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Address</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  {isSuperAdmin && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Branch ID</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {branches.map((b, idx) => {
                  const isAssigned = user.branchIds.includes(b.id);
                  return (
                    <tr key={b.id} className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/20'}`}>
                      <td className="px-5 py-3 text-xs font-mono text-slate-400 dark:text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"><ClinicIcon /></div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{b.name}</div>
                            {!canSeeAll && isAssigned && <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Your branch</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><LocationIcon /><span>{b.address}</span></div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />Active
                        </span>
                      </td>
                      {isSuperAdmin && <td className="px-5 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">{b.id.slice(0, 12)}…</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}