import { useEffect, useMemo, useState } from 'react';
import { clearToken, getMe, getSetupStatus } from './api';
import type { AuthUser } from './api';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import AppointmentScheduler from './pages/AppointmentScheduler';
import { HospitalsPage } from './pages/HospitalsPage';
import { BranchesPage } from './pages/BranchesPage';
import { ExportPage } from './pages/ExportPage';
import { SetupWizardPage } from './pages/SetupWizardPage';
import { StaffPage } from './pages/StaffPage';
type Route = 'dashboard' | 'clients' | 'scheduler' | 'hospitals' | 'branches' | 'export'| 'staff';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
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
  Logout: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M10 17l-1 0a4 4 0 01-4-4V7a4 4 0 014-4h1" />
      <path strokeLinecap="round" d="M15 7l5 5-5 5" />
      <path strokeLinecap="round" d="M20 12H10" />
    </svg>
  ),
  Clinic: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v4m-2-2h4" />
    </svg>
  ),
  Export: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Sun: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Moon: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  Staff: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

// SUPER_ADMIN: Dashboard, Clients, Scheduler, Branches, Clinics, Export
// STAFF:       Dashboard, Clients, Scheduler, Clinics
const ALL_NAV = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: Icons.Home,     adminOnly: false },
  { key: 'clients'   as const, label: 'Clients',   icon: Icons.Users,    adminOnly: false },
  { key: 'scheduler' as const, label: 'Scheduler', icon: Icons.Calendar, adminOnly: false },
  { key: 'branches'  as const, label: 'Branches',  icon: Icons.Building, adminOnly: true  },
  { key: 'hospitals' as const, label: 'Clinics',   icon: Icons.Clinic,   adminOnly: false },
  { key: 'export'    as const, label: 'Export',    icon: Icons.Export,   adminOnly: true  },
  { key: 'staff'     as const, label: 'Staff',     icon: Icons.Staff,    adminOnly: true  },
];

function getNavForUser(user: AuthUser) {
  return ALL_NAV.filter((n) => !n.adminOnly || user.role === 'SUPER_ADMIN');
}

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: (p: { className?: string }) => JSX.Element;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
      )}
    >
      {icon({ className: cx('h-5 w-5', active ? 'text-white' : 'text-slate-500 dark:text-slate-400') })}
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function RoleBadge({ role }: { role: AuthUser['role'] }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        role === 'SUPER_ADMIN'
          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
      )}
    >
      {role === 'SUPER_ADMIN' ? 'Admin' : 'Staff'}
    </span>
  );
}

function MobileDrawer({
  open, onClose, route, setRoute, me, onLogout, nav, dark, toggleDark,
}: {
  open: boolean; onClose: () => void; route: Route; setRoute: (r: Route) => void;
  me: AuthUser; onLogout: () => void; nav: typeof ALL_NAV; dark: boolean; toggleDark: () => void;
}) {
  return (
    <div className={cx('fixed inset-0 z-50 md:hidden', open ? '' : 'pointer-events-none')}>
      <div
        className={cx('absolute inset-0 bg-black/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cx(
          'absolute left-0 top-0 h-full w-[88%] max-w-xs flex flex-col',
          'bg-white dark:bg-slate-800 shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-sm">
              AS
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Appointment Schedule
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{me.name}</span>
                <RoleBadge role={me.role} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              aria-label="Close menu"
            >
              <Icons.X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="px-2 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Navigation
          </div>
          <div className="flex flex-col gap-1">
            {nav.map((n) => (
              <NavItem
                key={n.key}
                active={route === n.key}
                onClick={() => { setRoute(n.key); onClose(); }}
                icon={n.icon}
                label={n.label}
              />
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <button
            onClick={toggleDark}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 h-11 font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
          >
            {dark ? <Icons.Sun className="h-4 w-4" /> : <Icons.Moon className="h-4 w-4" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-700 h-11 font-semibold text-sm text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition"
          >
            <Icons.Logout className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileBottomBar({ route, setRoute, nav }: { route: Route; setRoute: (r: Route) => void; nav: typeof ALL_NAV }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {nav.map((n) => {
          const active = route === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setRoute(n.key)}
              className={cx(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition',
                active ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400',
              )}
            >
              <n.icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [route, setRoute] = useState<Route>('dashboard');
  const [bootError, setBootError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // ── Dark mode ──────────────────────────────────────────────────────────────
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  function toggleDark() { setDark((d) => !d); }

  const nav = useMemo(() => (me ? getNavForUser(me) : []), [me]);

  const pageTitle = useMemo((): string => {
    const titles: Record<Route, string> = {
      dashboard: 'Dashboard', clients: 'Clients', scheduler: 'Appointment Scheduler',
      branches: 'Branches', hospitals: 'Clinics', export: 'Export Reports', staff: 'Staff Management',
    };
    return titles[route] ?? 'Dashboard';
  }, [route]);

  const pageSubtitle = useMemo((): string => {
    const subs: Record<Route, string> = {
      dashboard: 'Overview of today and upcoming workload.',
      clients: 'Manage client records by branch.',
      scheduler: 'Create appointments and view schedule windows.',
      branches: 'Manage company branches (North, West, Central etc).',
      hospitals: 'Manage clinic destinations for appointments.',
      export: 'Download appointment and client data as CSV files.',
      staff: 'Invite team members and manage branch access.',
    };
    return subs[route] ?? '';
  }, [route]);

  async function bootstrap() {
    setBootError('');
    try {
      const {needsSetup: ns} = await getSetupStatus();
      setNeedsSetup(ns);
      if (ns) return;

      const res = await getMe();
      setMe(res.user);
      if (res.user.role === 'STAFF' && (route === 'branches' || route === 'export' || route === 'staff')) {
        setRoute('dashboard');
      }
    } catch (e: any) {
      setMe(null);
      setBootError(e?.message ?? String(e));
    }
  }

  useEffect(() => { bootstrap(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (me?.role === 'STAFF' && (route === 'branches' || route === 'export' || route === 'staff')) {
      setRoute('dashboard');
    }
  }, [me, route]);

  function logout() {
    clearToken();
    setMe(null);
    setRoute('dashboard');
    setMobileMenuOpen(false);
  }
  if (needsSetup) {
  return <SetupWizardPage onComplete={bootstrap} />;
}

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!me) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors">
        <div className="mx-auto max-w-md px-4 pt-10">
          <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-sm">
                AS
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">Appointment Schedule</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Sign in to manage branches, clients, clinics and schedules.
                </div>
              </div>
              {/* Dark mode toggle visible on login screen too */}
              <button
                onClick={toggleDark}
                className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                aria-label="Toggle dark mode"
              >
                {dark ? <Icons.Sun className="h-4 w-4" /> : <Icons.Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <LoginPage onLoggedIn={bootstrap} />
          </div>

          {bootError && (
            <div className="mt-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3 text-xs text-rose-800 dark:text-rose-300">
              {bootError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Authenticated app shell ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        route={route}
        setRoute={setRoute}
        me={me}
        onLogout={logout}
        nav={nav}
        dark={dark}
        toggleDark={toggleDark}
      />

      <div className="flex flex-col md:flex-row">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm z-30">

          {/* Brand / user info */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-sm">
                AS
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                  Appointment Schedule
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{me.name}</span>
                  <RoleBadge role={me.role} />
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="px-2 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Navigation
            </div>
            <div className="flex flex-col gap-1">
              {nav.map((n) => (
                <NavItem
                  key={n.key}
                  active={route === n.key}
                  onClick={() => setRoute(n.key)}
                  icon={n.icon}
                  label={n.label}
                />
              ))}
            </div>
          </nav>

          {/* Dark mode toggle + Logout */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <button
              onClick={toggleDark}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 h-10 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
            >
              {dark ? <Icons.Sun className="h-4 w-4" /> : <Icons.Moon className="h-4 w-4" />}
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-700 h-10 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition"
            >
              <Icons.Logout className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content area ── */}
        <div className="flex-1 md:ml-72 flex flex-col min-h-screen">

          {/* Sticky top header */}
          <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6">

              {/* Mobile: hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700"
                aria-label="Open menu"
              >
                <Icons.Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </button>

              <div className="min-w-0">
                <div className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {pageTitle}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{pageSubtitle}</div>
              </div>

              {/* Desktop: name + dark toggle + logout */}
              <div className="ml-auto hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{me.name}</div>
                  <RoleBadge role={me.role} />
                </div>
                <button
                  onClick={toggleDark}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                  aria-label="Toggle dark mode"
                >
                  {dark ? <Icons.Sun className="h-5 w-5" /> : <Icons.Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-4 h-10 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                >
                  <Icons.Logout className="h-4 w-4" />
                  Logout
                </button>
              </div>

              {/* Mobile: dark mode toggle in top-right */}
              <div className="ml-auto md:hidden">
                <button
                  onClick={toggleDark}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  aria-label="Toggle dark mode"
                >
                  {dark ? <Icons.Sun className="h-5 w-5" /> : <Icons.Moon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-4 md:p-6">
              {route === 'dashboard'  && <DashboardPage user={me} />}
              {route === 'clients'    && <ClientsPage user={me} />}
              {route === 'scheduler'  && <AppointmentScheduler user={me} />}
              {route === 'branches'   && me.role === 'SUPER_ADMIN' && <BranchesPage user={me} />}
              {route === 'hospitals'  && <HospitalsPage />}
              {route === 'export'     && me.role === 'SUPER_ADMIN' && <ExportPage user={me} />}
              {route === 'staff'      && me.role === 'SUPER_ADMIN' && <StaffPage />}
            </div>
          </main>
        </div>
      </div>

      <MobileBottomBar route={route} setRoute={setRoute} nav={nav} />
    </div>
  );
}