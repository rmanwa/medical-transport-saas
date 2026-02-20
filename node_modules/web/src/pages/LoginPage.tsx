import { useState } from 'react';
import { login, setToken } from '../api';

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('manager@acmemedtransport.com');
  const [password, setPassword] = useState('Password123!');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await login(email, password);
      setToken(res.accessToken);
      onLoggedIn();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 20, border: '1px solid #ddd', borderRadius: 12 }}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <label>
          Email
          <input style={{ width: '100%', padding: 8 }} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input style={{ width: '100%', padding: 8 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {err && <div style={{ padding: 10, border: '1px solid #f3b', borderRadius: 10 }}>{err}</div>}

        <button disabled={loading} type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Seed creds: <b>manager@acmemedtransport.com</b> / <b>Password123!</b> (or staff@acmemedtransport.com)
        </div>
      </form>
    </div>
  );
}
