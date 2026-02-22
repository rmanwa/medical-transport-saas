import React, { useMemo, useState } from 'react';

/**
 * DashboardShell.tsx
 * - Mobile-first responsive shell with Sidebar + Branch Switcher
 * - Lively "White & Slate" theme with Trust Blue accents
 * - Mobile drawer for filters, bottom nav, and desktop fixed sidebar
 */

// ---------- Types ----------
export type Branch = { id: string; name: string; address?: string };

// ---------- Small helpers ----------
function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

// ---------- Icons (inline SVG; no libs) ----------
function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={classNames('inline-flex items-center justify-center', className)}>
      {children}
    </span>
  );
}

const Icons = {
  Menu: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Home: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M3 10.5l9-7 9 7" />
      <path strokeLinecap="round" d="M5 10v10h14V10" />
    </svg>
  ),
  Users: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" />
      <path strokeLinecap="round" d="M4 20c1.5-4 14.5-4 16 0" />
    </svg>
  ),
  Calendar: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M7 3v3M17 3v3" />
      <path strokeLinecap="round" d="M4 8h16" />
      <path strokeLinecap="round" d="M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
  ),
  Building: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 21V3h16v18" />
      <path strokeLinecap="round" d="M9 21v-6h6v6" />
      <path strokeLinecap="round" d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" />
    </svg>
  ),
  Filter: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  ),
};

// ---------- UI primitives ----------
function Button({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'slate';
  className?: string;
  disabled?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 font-semibold transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed h-12 md:h-10';
  const styles = {
    primary:
      'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
    ghost:
      'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm',
    slate:
      'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  }[variant];

  return (
    <button disabled={disabled} onClick={onClick} className={classNames(base, styles, className)}>
      {children}
    </button>
  );
}

function Card({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {(title || right) && (
        <div className="flex items-start gap-3 p-4">
          <div className="min-w-0">
            {title && <div className="text-base md:text-lg font-extrabold text-slate-900">{title}</div>}
            {subtitle && <div className="text-sm text-slate-600">{subtitle}</div>}
          </div>
          <div className="ml-auto">{right}</div>
        </div>
      )}
      <div className={classNames(title || right ? 'px-4 pb-4' : 'p-4')}>{children}</div>
    </div>
  );
}

function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={classNames('fixed inset-0 z-50', open ? '' : 'pointer-events-none')}>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={classNames(
          'absolute inset-0 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      {/* panel */}
      <div
        className={classNames(
          'absolute right-0 top-0 h-full w-[92%] max-w-sm bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 p-4">
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <div className="ml-auto">
            <Button variant="ghost" onClick={onClose} className="px-3">
              <Icon className="h-5 w-5">{Icons.X({})}</Icon>
              Close
            </Button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ---------- Branch Switcher ----------
function BranchSwitcher({
  branches,
  branchId,
  onChange,
  compact,
}: {
  branches: Branch[];
  branchId: string;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  const selected = branches.find((b) => b.id === branchId) || branches[0];

  return (
    <div className={classNames('w-full', compact ? '' : 'max-w-sm')}>
      <div className={classNames('text-xs font-semibold text-slate-600', compact ? 'mb-1' : 'mb-2')}>
        Branch
      </div>
      <div className="relative">
        <select
          value={selected?.id}
          onChange={(e) => onChange(e.target.value)}
          className={classNames(
            'w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-slate-900 shadow-sm outline-none',
            'h-12 md:h-10',
          )}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M5.25 7.5l4.75 5 4.75-5H5.25z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ---------- Sidebar ----------
type NavKey = 'dashboard' | 'patients' | 'shifts' | 'hospitals';

const NAV: Array<{
  key: NavKey;
  label: string;
  icon: (p: { className?: string }) => JSX.Element;
}> = [
  { key: 'dashboard', label: 'Dashboard', icon: Icons.Home },
  { key: 'patients', label: 'Patients', icon: Icons.Users },
  { key: 'shifts', label: 'Scheduler', icon: Icons.Calendar },
  { key: 'hospitals', label: 'Hospitals', icon: Icons.Building },
];

function Sidebar({
  nav,
  onNav,
  branches,
  branchId,
  onBranch,
}: {
  nav: NavKey;
  onNav: (k: NavKey) => void;
  branches: Branch[];
  branchId: string;
  onBranch: (id: string) => void;
}) {
  return (
    <div className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-slate-200 md:bg-white md:shadow-sm">
      {/* Brand / top */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-600/10" />
          <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-slate-900/5" />
          <div className="relative">
            <div className="text-xs font-semibold text-slate-500">Medical Transport</div>
            <div className="text-lg font-extrabold text-slate-900">Operations Console</div>
            <div className="mt-3">
              <BranchSwitcher branches={branches} branchId={branchId} onChange={onBranch} />
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="px-3">
        <div className="px-3 pb-2 text-xs font-semibold tracking-wide text-slate-500">Navigation</div>
        <div className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.key === nav;
            return (
              <button
                key={item.key}
                onClick={() => onNav(item.key)}
                className={classNames(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                <item.icon className={classNames('h-5 w-5', active ? 'text-white' : 'text-slate-500')} />
                <div className="font-semibold">{item.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="font-bold text-slate-900">Tip</div>
          Keep urgent appointments highlighted and confirm driver availability early.
        </div>
      </div>
    </div>
  );
}

// ---------- Mobile Sidebar Overlay ----------
function MobileSidebar({
  open,
  onClose,
  nav,
  onNav,
  branches,
  branchId,
  onBranch,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavKey;
  onNav: (k: NavKey) => void;
  branches: Branch[];
  branchId: string;
  onBranch: (id: string) => void;
}) {
  return (
    <div className={classNames('fixed inset-0 z-50 md:hidden', open ? '' : 'pointer-events-none')}>
      <div
        onClick={onClose}
        className={classNames('absolute inset-0 bg-black/30 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
      />
      <div
        className={classNames(
          'absolute left-0 top-0 h-full w-[88%] max-w-xs bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="text-lg font-extrabold text-slate-900">Menu</div>
            <div className="ml-auto">
              <Button variant="ghost" onClick={onClose} className="px-3">
                <Icon className="h-5 w-5">{Icons.X({})}</Icon>
                Close
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <BranchSwitcher branches={branches} branchId={branchId} onChange={onBranch} compact />
          </div>
        </div>

        <div className="p-3">
          <div className="px-2 pb-2 text-xs font-semibold text-slate-500">Navigation</div>
          <div className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.key === nav;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onNav(item.key);
                    onClose();
                  }}
                  className={classNames(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                    active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <item.icon className={classNames('h-5 w-5', active ? 'text-white' : 'text-slate-500')} />
                  <div className="font-semibold">{item.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Bottom Bar (mobile) ----------
function MobileBottomBar({
  nav,
  onNav,
}: {
  nav: NavKey;
  onNav: (k: NavKey) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {NAV.map((item) => {
          const active = item.key === nav;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              className={classNames(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition',
                active ? 'text-blue-600' : 'text-slate-600',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Shell ----------
export function DashboardShell({
  branches,
  branchId,
  onBranchChange,
  nav,
  onNav,
  title,
  children,
}: {
  branches: Branch[];
  branchId: string;
  onBranchChange: (id: string) => void;
  nav: NavKey;
  onNav: (k: NavKey) => void;
  title: string;
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <Sidebar nav={nav} onNav={onNav} branches={branches} branchId={branchId} onBranch={onBranchChange} />

        {/* Mobile Sidebar */}
        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          nav={nav}
          onNav={onNav}
          branches={branches}
          branchId={branchId}
          onBranch={onBranchChange}
        />

        {/* Main */}
        <div className="flex-1">
          {/* Top header (mobile + desktop) */}
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
              {/* mobile menu */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
                aria-label="Open menu"
              >
                <Icons.Menu className="h-6 w-6 text-slate-700" />
              </button>

              {/* Title */}
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-slate-900 md:text-2xl leading-tight">
                  {title}
                </div>
                <div className="text-sm text-slate-600 hidden sm:block">
                  White & Slate theme • Trust Blue highlights • Mobile-first
                </div>
              </div>

              {/* Branch switcher (mobile header) */}
              <div className="ml-auto hidden sm:block md:hidden w-44">
                <BranchSwitcher branches={branches} branchId={branchId} onChange={onBranchChange} compact />
              </div>

              {/* Filters button (mobile) */}
              <div className="md:hidden">
                <Button variant="ghost" onClick={() => setFiltersOpen(true)} className="px-3">
                  <Icons.Filter className="h-5 w-5" />
                  Filters
                </Button>
              </div>

              {/* Desktop quick actions */}
              <div className="hidden md:flex items-center gap-2 ml-auto">
                <Button variant="ghost" onClick={() => setFiltersOpen(true)} className="px-3">
                  <Icons.Filter className="h-5 w-5" />
                  Filters
                </Button>
                <Button variant="primary" onClick={() => alert('Primary action')}>
                  New appointment
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 md:px-6 md:pb-10">
            {/* Optional “lively” ribbon */}
            <div className="mb-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600/10 via-white to-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Today’s focus</div>
                  <div className="text-base md:text-lg font-extrabold text-slate-900">
                    Keep schedules tight, urgent rides obvious, and actions fast.
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => alert('View reports')}>
                    View reports
                  </Button>
                  <Button variant="primary" onClick={() => alert('Create appointment')}>
                    Create appointment
                  </Button>
                </div>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>

      {/* Drawer for filters (mobile + desktop) */}
      <Drawer open={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-bold text-slate-900">Quick filters</div>
            <div className="mt-2 text-sm text-slate-600">
              On mobile, complex filters live here. On desktop, you can also show them inline.
            </div>
          </div>

          <label className="block">
            <div className="text-xs font-semibold text-slate-600 mb-1">Search</div>
            <input
              className="h-12 md:h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-600/20"
              placeholder="Patient, hospital, notes…"
            />
          </label>

          <div className="grid grid-cols-1 gap-3">
            <label className="block">
              <div className="text-xs font-semibold text-slate-600 mb-1">Priority</div>
              <select className="h-12 md:h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-600/20">
                <option>All</option>
                <option>Urgent</option>
                <option>Normal</option>
              </select>
            </label>

            <label className="block">
              <div className="text-xs font-semibold text-slate-600 mb-1">Type</div>
              <select className="h-12 md:h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-600/20">
                <option>All</option>
                <option>Physical</option>
                <option>Virtual</option>
              </select>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={() => setFiltersOpen(false)} className="flex-1">
              Apply
            </Button>
            <Button variant="ghost" onClick={() => alert('Reset')} className="flex-1">
              Reset
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Mobile bottom bar */}
      <MobileBottomBar nav={nav} onNav={onNav} />
    </div>
  );
}

// ---------- Example page content (shows your requested responsive layouts) ----------
export default function DashboardShellDemo() {
  // Demo branches – replace with your API branches
  const branches: Branch[] = useMemo(
    () => [
      { id: 'b1', name: 'Downtown Branch', address: '77 W Monroe St' },
      { id: 'b2', name: 'Northside Branch', address: '2100 N Lake Shore' },
      { id: 'b3', name: 'Southside Branch', address: '6100 S Cottage Grove' },
    ],
    [],
  );

  const [branchId, setBranchId] = useState(branches[0].id);
  const [nav, setNav] = useState<NavKey>('dashboard');

  return (
    <DashboardShell
      branches={branches}
      branchId={branchId}
      onBranchChange={setBranchId}
      nav={nav}
      onNav={setNav}
      title={
        nav === 'dashboard'
          ? 'Dashboard'
          : nav === 'patients'
          ? 'Patients'
          : nav === 'shifts'
          ? 'Scheduler'
          : 'Hospitals'
      }
    >
      {/* DASHBOARD GRID: grid-cols-1 (mobile) -> grid-cols-12 (desktop) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* KPI cards */}
        <div className="md:col-span-12 grid grid-cols-1 gap-4 md:grid-cols-12">
          <Card className="md:col-span-3" title="Shifts today" subtitle="All branches">
            <div className="text-3xl font-extrabold text-slate-900">12</div>
            <div className="mt-2 text-sm text-slate-600">+3 vs yesterday</div>
          </Card>

          <Card className="md:col-span-3" title="Urgent" subtitle="Needs attention">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-extrabold text-slate-900">2</div>
              <span className="rounded-full bg-blue-600/10 px-2 py-1 text-xs font-bold text-blue-700">
                BLUE ALERT
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-600">Confirm transport windows</div>
          </Card>

          <Card className="md:col-span-3" title="Patients" subtitle="Current branch">
            <div className="text-3xl font-extrabold text-slate-900">48</div>
            <div className="mt-2 text-sm text-slate-600">Active + recurring</div>
          </Card>

          <Card className="md:col-span-3" title="Hospitals" subtitle="Company-wide">
            <div className="text-3xl font-extrabold text-slate-900">9</div>
            <div className="mt-2 text-sm text-slate-600">Destinations managed</div>
          </Card>
        </div>

        {/* Scheduler area:
            - stacks on mobile (grid-cols-1)
            - split view on desktop (md:grid-cols-12)
        */}
        <div className="md:col-span-12">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Calendar */}
            <Card
              className="md:col-span-7"
              title="Calendar"
              subtitle="Range view — stacked on mobile, split on desktop"
              right={
                <div className="hidden md:flex gap-2">
                  <Button variant="ghost" onClick={() => alert('Today')}>
                    Today
                  </Button>
                  <Button variant="ghost" onClick={() => alert('Tomorrow')}>
                    Tomorrow
                  </Button>
                  <Button variant="ghost" onClick={() => alert('Next 7 days')}>
                    Next 7 days
                  </Button>
                </div>
              }
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-700">Calendar placeholder</div>
                <div className="mt-2 text-sm text-slate-600">
                  Plug your schedule table or calendar component here. The layout is already responsive.
                </div>

                {/* Complex filters inline: hidden on mobile, shown on desktop */}
                <div className="mt-4 hidden md:block">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-sm font-bold text-slate-900">Desktop filters</div>
                    <div className="mt-2 grid grid-cols-12 gap-3">
                      <input
                        className="col-span-5 h-10 rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                        placeholder="Search patient / hospital…"
                      />
                      <select className="col-span-3 h-10 rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-blue-600/20">
                        <option>All priorities</option>
                        <option>Urgent</option>
                        <option>Normal</option>
                      </select>
                      <select className="col-span-4 h-10 rounded-xl border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-blue-600/20">
                        <option>All types</option>
                        <option>Physical</option>
                        <option>Virtual</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Appointment form */}
            <Card className="md:col-span-5" title="Create appointment" subtitle="Touch-friendly on mobile">
              <div className="space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Patient</div>
                  <select className="h-12 md:h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-600/20">
                    <option>Select patient…</option>
                    <option>John Doe</option>
                    <option>Mary Smith</option>
                  </select>
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Hospital</div>
                  <select className="h-12 md:h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-600/20">
                    <option>(none)</option>
                    <option>Downtown Imaging</option>
                    <option>Lakeside Clinic</option>
                  </select>
                </label>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Start</div>
                    <input
                      type="datetime-local"
                      className="h-12 md:h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-semibold text-slate-600 mb-1">End</div>
                    <input
                      type="datetime-local"
                      className="h-12 md:h-10 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2 md:flex-row">
                  <Button variant="primary" className="flex-1" onClick={() => alert('Create')}>
                    Create (Blue)
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => alert('Reset')}>
                    Reset
                  </Button>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-600/5 p-3">
                  <div className="text-sm font-bold text-slate-900">Unique touch</div>
                  <div className="text-sm text-slate-600">
                    Use blue only for high-trust actions. Everything else stays slate/white for calm operations.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Activity */}
        <Card className="md:col-span-12" title="Live activity" subtitle="Small details make it feel premium">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { t: 'Urgent shift created', d: 'Patient: Mary Smith • 9:30 AM', tag: 'URGENT' },
              { t: 'Hospital updated', d: 'Lakeside Clinic address edited', tag: 'INFO' },
              { t: 'Branch switched', d: 'Now viewing Downtown Branch', tag: 'OK' },
            ].map((x, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="font-extrabold text-slate-900">{x.t}</div>
                  <span
                    className={classNames(
                      'ml-auto rounded-full px-2 py-1 text-xs font-bold',
                      x.tag === 'URGENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700',
                    )}
                  >
                    {x.tag}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-600">{x.d}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}