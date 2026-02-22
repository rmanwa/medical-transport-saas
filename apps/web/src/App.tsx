import { useEffect, useMemo, useState } from 'react';
import { clearToken, getMe } from './api';
import type { AuthUser } from './api';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import ShiftsPage from './pages/Shifts';
import { HospitalsPage } from './pages/HospitalsPage';

type Route = 'dashboard' | 'patients' | 'shifts' | 'hospitals';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cx('inline-flex items-center justify-center', className)}>{children}</span>;
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
};

const NAV = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: Icons.Home },
  { key: 'patients' as const, label: 'Patients', icon: Icons.Users },
  { key: 'shifts' as const, label: 'Scheduler', icon: Icons.Calendar },
  { key: 'hospitals' as const, label: 'Hospitals', icon: Icons.Building },
];

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

function MobileDrawer({
  open,
  onClose,
  route,
  setRoute,
  me,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  route: Route;
  setRoute: (r: Route) => void;
  me: AuthUser;
  onLogout: () => void;
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
              MT
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold text-slate-900 leading-tight">Medical Transport</div>
              <div className="text-xs text-slate-600 leading-tight truncate">
                {me.name} • {me.role}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white"
              aria-label="Close menu"
            >
              <Icons.X className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="px-2 pb-2 text-xs font-semibold text-slate-500">Navigation</div>
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <NavItem
                key={n.key}
                active={route === n.key}
                onClick={() => {
                  setRoute(n.key);
                  onClose();
                }}
                icon={n.icon}
                label={n.label}
              />
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">Quick tip</div>
            <div className="mt-1 text-sm text-slate-700">
              Keep urgent rides highlighted and confirm time windows early.
            </div>
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
}: {
  route: Route;
  setRoute: (r: Route) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {NAV.map((n) => {
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

  const pageTitle = useMemo(() => {
    if (route === 'dashboard') return 'Dashboard';
    if (route === 'patients') return 'Patients';
    if (route === 'shifts') return 'Scheduler';
    return 'Hospitals';
  }, [route]);

  const pageSubtitle = useMemo(() => {
    if (route === 'dashboard') return 'Overview of today and upcoming workload.';
    if (route === 'patients') return 'Manage patient records by branch.';
    if (route === 'shifts') return 'Create appointments and view schedule windows.';
    return 'Manage hospital destinations (company-wide).';
  }, [route]);

  async function bootstrap() {
    setBootError('');
    try {
      const res = await getMe();
      setMe(res.user);
    } catch (e: any) {
      setMe(null);
      setBootError(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

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
                MT
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900">Medical Transport</div>
                <div className="text-sm text-slate-600">
                  Sign in to manage branches, patients, hospitals and schedules.
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
      {/* Mobile drawer */}
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        route={route}
        setRoute={setRoute}
        me={me}
        onLogout={logout}
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
                    MT
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 leading-tight">Medical Transport</div>
                    <div className="text-xs text-slate-600 leading-tight truncate">{me.name} • {me.role}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs font-semibold text-slate-500">
                  Operations Console
                </div>
              </div>
            </div>
          </div>

          <div className="px-3">
            <div className="px-3 pb-2 text-xs font-semibold tracking-wide text-slate-500">Navigation</div>
            <div className="flex flex-col gap-1">
              {NAV.map((n) => (
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
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="font-bold text-slate-900">Tip</div>
              Keep urgent appointments obvious and time windows accurate.
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Top header */}
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
              {/* Mobile hamburger */}
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
                <div className="text-sm text-slate-600 hidden sm:block">
                  {pageSubtitle}
                </div>
              </div>

              <div className="ml-auto hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{me.name}</div>
                  <div className="text-xs text-slate-600">{me.role}</div>
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

          {/* Content */}
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 pb-24 md:pb-10">
            {/* Lively ribbon */}
            <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600/10 via-white to-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">Today’s focus</div>
                  <div className="text-base md:text-lg font-extrabold text-slate-900">
                    Fast scheduling, clean data, obvious urgent rides.
                  </div>
                </div>
                <div className="hidden md:flex gap-2">
                  <button className="h-10 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition">
                    View reports
                  </button>
                  <button className="h-10 rounded-xl bg-blue-600 px-3 font-semibold text-white shadow-sm hover:bg-blue-700 transition">
                    New appointment
                  </button>
                </div>
              </div>
            </div>

            {/* Page surface */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {route === 'dashboard' && <DashboardPage />}
              {route === 'patients' && <PatientsPage />}
              {route === 'shifts' && <ShiftsPage />}
              {route === 'hospitals' && <HospitalsPage />}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <MobileBottomBar route={route} setRoute={setRoute} />
    </div>
  );
}