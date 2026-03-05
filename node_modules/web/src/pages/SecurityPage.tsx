import { useEffect, useState } from 'react';
import { get2FAStatus, setup2FA, confirm2FA, disable2FA } from '../api';

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition';
const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1';

export function SecurityPage() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Setup state
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  // Disable state
  const [disableMode, setDisableMode] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const res = await get2FAStatus();
      setTwoFAEnabled(res.enabled);
    } catch {
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup() {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await setup2FA();
      setQrCode(res.qrCodeDataUrl);
      setSecret(res.secret);
      setSetupMode(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start 2FA setup');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmCode || !/^\d{6}$/.test(confirmCode)) {
      setError('Enter a valid 6-digit code');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await confirm2FA(confirmCode);
      setTwoFAEnabled(true);
      setSetupMode(false);
      setQrCode('');
      setSecret('');
      setConfirmCode('');
      setSuccess('Two-factor authentication has been enabled successfully!');
    } catch {
      setError('Invalid code. Make sure your authenticator is synced and try again.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    if (!disablePassword) {
      setError('Password is required');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await disable2FA(disablePassword);
      setTwoFAEnabled(false);
      setDisableMode(false);
      setDisablePassword('');
      setSuccess('Two-factor authentication has been disabled.');
    } catch {
      setError('Incorrect password. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Security</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your two-factor authentication settings.</p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          {success}
        </div>
      )}

      {/* 2FA Status Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${twoFAEnabled ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <svg className={`h-5 w-5 ${twoFAEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {twoFAEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
            twoFAEnabled
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
          }`}>
            {twoFAEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Actions */}
        {!setupMode && !disableMode && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {!twoFAEnabled ? (
              <button
                onClick={handleSetup}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {actionLoading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            ) : (
              <button
                onClick={() => { setDisableMode(true); setError(''); setSuccess(''); }}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
              >
                Disable 2FA
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Setup Flow: QR Code + Confirm ────────────────────────────── */}
      {setupMode && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 space-y-4">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">Set Up Your Authenticator</h3>

          <div className="space-y-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              1. Download an authenticator app like <strong>Google Authenticator</strong> or <strong>Authy</strong> on your phone.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              2. Scan this QR code with your authenticator app:
            </p>

            <div className="flex justify-center py-3">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            </div>

            <details className="text-sm text-blue-800 dark:text-blue-300">
              <summary className="cursor-pointer font-semibold hover:text-blue-600">Can't scan? Enter this code manually</summary>
              <code className="block mt-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono break-all border border-blue-200 dark:border-blue-700">
                {secret}
              </code>
            </details>

            <p className="text-sm text-blue-800 dark:text-blue-300">
              3. Enter the 6-digit code from your app to confirm:
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-3">
            <div>
              <label className={labelCls}>Verification Code</label>
              <input
                type="text"
                className={inputCls}
                placeholder="000000"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {actionLoading ? 'Verifying...' : 'Confirm & Enable'}
              </button>
              <button
                type="button"
                onClick={() => { setSetupMode(false); setQrCode(''); setSecret(''); setConfirmCode(''); }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Disable Flow: Password Confirm ───────────────────────────── */}
      {disableMode && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-5 space-y-4">
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Disable Two-Factor Authentication</h3>
          <p className="text-sm text-rose-800 dark:text-rose-300">
            This will make your account less secure. Enter your password to confirm.
          </p>

          <form onSubmit={handleDisable} className="space-y-3">
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                className={inputCls}
                placeholder="Enter your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {actionLoading ? 'Disabling...' : 'Disable 2FA'}
              </button>
              <button
                type="button"
                onClick={() => { setDisableMode(false); setDisablePassword(''); }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">How does 2FA work?</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Two-factor authentication adds an extra security step when you sign in. After entering your password,
          you'll be asked for a 6-digit code from your authenticator app. This means even if someone gets your
          password, they can't access your account without your phone.
        </p>
      </div>
    </div>
  );
}