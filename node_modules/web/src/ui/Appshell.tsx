import { cn } from './cn';
import { Button } from './Button';

type Route = 'dashboard' | 'patients' | 'shifts' | 'hospitals';

export function AppShell(props: {
  route: Route;
  setRoute: (r: Route) => void;
  userLabel: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const { route, setRoute, userLabel, onLogout, children } = props;

  const Tab = (p: { id: Route; label: string }) => {
    const active = route === p.id;
    return (
      <button
        onClick={() => setRoute(p.id)}
        className={cn(
          'rounded-xl px-3 py-2 text-sm font-semibold transition',
          active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
        )}
        aria-current={active ? 'page' : undefined}
      >
        {p.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white font-black">
              MT
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold">Medical Transport</div>
              <div className="text-xs text-slate-500">Operations Console</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-2 md:flex">
            <Tab id="dashboard" label="Dashboard" />
            <Tab id="patients" label="Patients" />
            <Tab id="shifts" label="Shifts" />
            <Tab id="hospitals" label="Hospitals" />
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <div className="text-sm text-slate-600">{userLabel}</div>
            <Button variant="secondary" onClick={onLogout}>
              Logout
            </Button>
          </div>

          {/* Mobile nav */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value as Route)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
            >
              <option value="dashboard">Dashboard</option>
              <option value="patients">Patients</option>
              <option value="shifts">Shifts</option>
              <option value="hospitals">Hospitals</option>
            </select>
            <Button variant="secondary" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}