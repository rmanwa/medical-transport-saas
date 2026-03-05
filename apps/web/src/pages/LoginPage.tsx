import { useState } from 'react';
import { login, verify2FA, forgotPassword, resetPassword, setToken } from '../api';
import type { Login2FAResponse } from '../api';
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

const ShieldIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BackIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

type View = 'login' | '2fa' | 'forgot' | 'reset';

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { showToast } = useToast();
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2FA state
  const [tempToken, setTempToken] = useState('');
  const [twoFACode, setTwoFACode] = useState('');

  // Forgot/Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ─── Login submit ──────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { showToast('Email is required', 'error'); return; }
    if (!password) { showToast('Password is required', 'error'); return; }

    setLoading(true);
    try {
      const res = await login(email, password);

      if ('requires2FA' in res && res.requires2FA) {
        // 2FA is required — show code input
        setTempToken((res as Login2FAResponse).tempToken);
        setView('2fa');
        showToast('Enter your 2FA code from your authenticator app', 'success');
      } else if ('accessToken' in res) {
        // No 2FA — login directly
        setToken(res.accessToken);
        showToast('Login successful!', 'success');
        onLoggedIn();
      }
    } catch (e: any) {
      showToast(e?.message ?? 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── 2FA verify submit ────────────────────────────────────────────────
  async function handle2FAVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFACode || !/^\d{6}$/.test(twoFACode)) {
      showToast('Enter a valid 6-digit code', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await verify2FA(tempToken, twoFACode);
      setToken(res.accessToken);
      showToast('Login successful!', 'success');
      onLoggedIn();
    } catch (e: any) {
      showToast('Invalid or expired code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Forgot password submit ───────────────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      showToast('Enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(resetEmail);
      setView('reset');
      showToast('If an account exists, a reset code has been sent to your email.', 'success');
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to send reset code', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Reset password submit ────────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetCode || !/^\d{6}$/.test(resetCode)) {
      showToast('Enter the 6-digit code from your email', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetEmail, resetCode, newPassword);
      showToast('Password reset successful! You can now sign in.', 'success');
      setView('login');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      showToast('Invalid or expired reset code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function goBackToLogin() {
    setView('login');
    setTwoFACode('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-slate-900 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900 flex items-center justify-center p-4">
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
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Appointment Schedule</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Operations Console</p>
            </div>
          </div>
        </Card>

        {/* ─── Login Form ─────────────────────────────────────────────── */}
        {view === 'login' && (
          <Card variant="elevated">
            <CardHeader title="Welcome Back" subtitle="Sign in to manage your operations" />
            <CardBody>
              <form onSubmit={handleLogin} className="space-y-4">
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

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setView('forgot'); }}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button type="submit" variant="primary" fullWidth loading={loading} icon={<LoginIcon />} size="lg">
                  Sign In
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* ─── 2FA Verification ───────────────────────────────────────── */}
        {view === '2fa' && (
          <Card variant="elevated">
            <CardHeader title="Two-Factor Authentication" subtitle="Enter the 6-digit code from your authenticator app" />
            <CardBody>
              <form onSubmit={handle2FAVerify} className="space-y-4">
                <Input
                  type="text"
                  label="Verification Code"
                  placeholder="000000"
                  value={twoFACode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFACode(val);
                  }}
                  leftIcon={<ShieldIcon />}
                  disabled={loading}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                />

                <Button type="submit" variant="primary" fullWidth loading={loading} icon={<ShieldIcon />} size="lg">
                  Verify Code
                </Button>

                <button
                  type="button"
                  onClick={goBackToLogin}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition pt-2"
                >
                  <BackIcon /> Back to login
                </button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* ─── Forgot Password (enter email) ─────────────────────────── */}
        {view === 'forgot' && (
          <Card variant="elevated">
            <CardHeader title="Reset Password" subtitle="Enter your email to receive a reset code" />
            <CardBody>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="your.email@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  leftIcon={<EmailIcon />}
                  disabled={loading}
                  required
                  autoComplete="email"
                  autoFocus
                />

                <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
                  Send Reset Code
                </Button>

                <button
                  type="button"
                  onClick={goBackToLogin}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition pt-2"
                >
                  <BackIcon /> Back to login
                </button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* ─── Reset Password (enter code + new password) ────────────── */}
        {view === 'reset' && (
          <Card variant="elevated">
            <CardHeader title="Enter Reset Code" subtitle={`We sent a 6-digit code to ${resetEmail}`} />
            <CardBody>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  type="text"
                  label="Reset Code"
                  placeholder="000000"
                  value={resetCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setResetCode(val);
                  }}
                  leftIcon={<ShieldIcon />}
                  disabled={loading}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                />

                <Input
                  type="password"
                  label="New Password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<LockIcon />}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<LockIcon />}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />

                <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
                  Reset Password
                </Button>

                <button
                  type="button"
                  onClick={goBackToLogin}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition pt-2"
                >
                  <BackIcon /> Back to login
                </button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <p>Secure appointment scheduling and management</p>
          <p className="mt-1">&copy; 2026 Appointment Schedule. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}