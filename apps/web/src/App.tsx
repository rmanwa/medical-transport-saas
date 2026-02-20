import { useEffect, useState } from 'react';
import { clearToken, getMe } from './api';
import type { AuthUser } from './api';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';

type Route = 'dashboard' | 'patients';

export default function App() {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [route, setRoute] = useState<Route>('dashboard');
  const [bootError, setBootError] = useState('');

  async function bootstrap() {
    setBootError('');
    try {
      const res = await getMe();
      setMe(res.user);
    } catch (e: any) {
      // token missing/invalid -> go to login
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
  }

  if (!me) {
    return (
      <>
        <LoginPage onLoggedIn={bootstrap} />
        {bootError && (
          <div style={{ maxWidth: 420, margin: '0 auto', padding: 10, opacity: 0.7, fontSize: 12 }}>
            {bootError}
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 10, alignItems: 'center' }}>
        <b style={{ marginRight: 8 }}>Medical Transport</b>

        <button onClick={() => setRoute('dashboard')} disabled={route === 'dashboard'}>
          Dashboard
        </button>
        <button onClick={() => setRoute('patients')} disabled={route === 'patients'}>
          Patients
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 13, opacity: 0.85 }}>
          {me.name} ({me.role})
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      {route === 'dashboard' && <DashboardPage />}
      {route === 'patients' && <PatientsPage />}
    </div>
  );
}
