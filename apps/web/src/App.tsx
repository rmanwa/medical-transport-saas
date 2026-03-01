import { useEffect, useMemo, useState } from 'react';
import { clearToken, getMe } from './api';
import type { AuthUser } from './api';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import AppointmentScheduler from './pages/AppointmentScheduler';
import { HospitalsPage } from './pages/HospitalsPage';
import { ClinicsPage } from './pages/ClinicsPage';

type Route = 'dashboard' | 'clients' | 'scheduler' | 'hospitals' | 'clinics';

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
};

// All possible nav items — Referral Clinics is SUPER_ADMIN only
const ALL_NAV = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: Icons.Home, adminOnly: false },
  { key: 'clients' as const, label: 'Clients', icon: Icons.Users, adminOnly: false },
  { key: 'scheduler' as const, label: 'Scheduler', icon: Icons.Calendar, adminOnly: false },
  { key: 'clinics' as const, label: 'Clinics', icon: Icons.Clinic, adminOnly: false },
  { key: 'hospitals' as const, label: 'Referral Clinics', icon: Icons.Building, adminOnly: true },
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
        active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50',
      )}
    >
      {icon({ className: cx('h-5 w-5', active ? 'text-white' : 'text-slate-500') })}
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
          ? 'bg-purple-100 text-purple-700'
          : 'bg-slate-100 text-slate-600',
      )}
    >
      {role === 'SUPER_ADMIN' ? 'Admin' : 'Staff'}
    </span>
  );
}

function MobileDrawer({
  open,
  onClose,
  route,
  setRoute,
  me,
  onLogout,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  route: Route;
  setRoute: (r: Route) => void;
  me: AuthUser;
  onLogout: () => void;
  nav: typeof ALL_NAV;
}) {
  return (
    <div className={cx('fixed inset-0 z-50 md:hidden', open ? '' : 'pointer-events-none')}>
      <div
        className={cx('absolute inset-0 bg-black/30 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cx(
          'absolute left-0 top-0 h-full w-[88%] max-w-xs bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-sm">
              AS
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-extrabold text-slate-900 leading-tight">Appointment Schedule</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-600 truncate">{me.name}</span>
                <RoleBadge role={me.role} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white"
              aria-label="Close menu"
            >
              <Icons.X className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="px-2 pb-2 text-xs font-semibold text-slate-500">Navigation</div>
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

          <button
            onClick={onLogout}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 h-12"
          >
            <Icons.Logout className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileBottomBar({
  route,
  setRoute,
  nav,
}: {
  route: Route;
  setRoute: (r: Route) => void;
  nav: typeof ALL_NAV;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {nav.map((n) => {
          const active = route === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setRoute(n.key)}
              className={cx(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition',
                active ? 'text-blue-600' : 'text-slate-600',
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

  // Compute nav based on role
  const nav = useMemo(() => (me ? getNavForUser(me) : []), [me]);

  const pageTitle = useMemo(() => {
    if (route === 'dashboard') return 'Dashboard';
    if (route === 'clients') return 'Clients';
    if (route === 'scheduler') return 'Appointment Scheduler';
    if (route === 'clinics') return 'Clinics';
    return 'Referral Clinics';
  }, [route]);

  const pageSubtitle = useMemo(() => {
    if (route === 'dashboard') return 'Overview of today and upcoming workload.';
    if (route === 'clients') return 'Manage client records by branch.';
    if (route === 'scheduler') return 'Create appointments and view schedule windows.';
    if (route === 'clinics') return 'View and manage clinic branches.';
    return 'Manage referral clinic destinations (company-wide).';
  }, [route]);

  async function bootstrap() {
    setBootError('');
    try {
      const res = await getMe();
      setMe(res.user);
      // If STAFF tries to access referral clinics page, redirect to dashboard
      if (res.user.role === 'STAFF' && route === 'hospitals') {
        setRoute('dashboard');
      }
    } catch (e: any) {
      setMe(null);
      setBootError(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard: if STAFF somehow navigates to referral clinics, bounce them
  useEffect(() => {
    if (me?.role === 'STAFF' && route === 'hospitals') {
      setRoute('dashboard');
    }
  }, [me, route]);
  function logout() {
    clearToken();
    setMe(null);
    setRoute('dashboard');
    setMobileMenuOpen(false);
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-md px-4 pt-10">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-sm">
                AS
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900">Appointment Schedule</div>
                <div className="text-sm text-slate-600">
                  Sign in to manage branches, clients, clinics and schedules.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <LoginPage onLoggedIn={bootstrap} />
          </div>

          {bootError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {bootError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        route={route}
        setRoute={setRoute}
        me={me}
        onLogout={logout}
        nav={nav}
      />

      <div className="flex flex-col md:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-slate-200 md:bg-white md:shadow-sm">
          <div className="p-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-600/10" />
              <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-slate-900/5" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-sm">
                    AS
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 leading-tight">Appointment Schedule</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-600 truncate">{me.name}</span>
                      <RoleBadge role={me.role} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3">
            <div className="px-3 pb-2 text-xs font-semibold tracking-wide text-slate-500">Navigation</div>
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
          </div>

          <div className="mt-auto p-4">
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-semibold text-white shadow-sm transition hover:bg-slate-800 h-11"
            >
              <Icons.Logout className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
                aria-label="Open menu"
              >
                <Icons.Menu className="h-6 w-6 text-slate-700" />
              </button>

              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-extrabold text-slate-900 leading-tight">
                  {pageTitle}
                </div>
                <div className="text-sm text-slate-600 hidden sm:block">{pageSubtitle}</div>
              </div>

              <div className="ml-auto hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{me.name}</div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <RoleBadge role={me.role} />
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800 hover:bg-slate-100 transition h-10"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 pb-24 md:pb-10">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {route === 'dashboard' && <DashboardPage user={me} />}
              {route === 'clients' && <ClientsPage user={me} />}
              {route === 'scheduler' && <AppointmentScheduler user={me} />}
              {route === 'clinics' && <ClinicsPage user={me} />}
              {route === 'hospitals' && me.role === 'SUPER_ADMIN' && <HospitalsPage />}
            </div>
          </main>
        </div>
      </div>

      <MobileBottomBar route={route} setRoute={setRoute} nav={nav} />
    </div>
  );
}