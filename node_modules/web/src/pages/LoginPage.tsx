import { useState } from 'react';
import { login, setToken } from '../api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

const LoginIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const EmailIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('manager@acmemedtransport.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    
    if (!password) {
      showToast('Password is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      setToken(res.accessToken);
      showToast('Login successful!', 'success');
      onLoggedIn();
    } catch (e: any) {
      showToast(e?.message ?? 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand Card */}
        <Card variant="glass" className="text-center">
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-blue-600 blur-xl opacity-50 animate-pulse" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-white">AS</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Appointment Schedule</h1>
              <p className="mt-1 text-sm text-slate-600">Operations Console</p>
            </div>
          </div>
        </Card>

        {/* Login Form Card */}
        <Card variant="elevated">
          <CardHeader 
            title="Welcome Back" 
            subtitle="Sign in to manage your operations"
          />
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <Input
                type="email"
                label="Email Address"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<EmailIcon />}
                disabled={loading}
                required
                autoComplete="email"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<LockIcon />}
                disabled={loading}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                icon={<LoginIcon />}
                size="lg"
              >
                Sign In
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-blue-900">Demo Credentials</h4>
                  <div className="mt-2 space-y-1 text-xs text-blue-800">
                    <div className="font-mono">
                      <strong>Manager:</strong> manager@acmemedtransport.com
                    </div>
                    <div className="font-mono">
                      <strong>Staff:</strong> staff@acmemedtransport.com
                    </div>
                    <div className="font-mono">
                      <strong>Password:</strong> Password123!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>Secure appointment scheduling and management</p>
          <p className="mt-1">© 2026 Appointment Schedule. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}