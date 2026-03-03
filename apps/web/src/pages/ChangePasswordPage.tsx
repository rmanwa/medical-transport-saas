import { useState } from 'react';
import { changePassword } from '../api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChangePasswordPageProps {
  /** Called after successful password change so App.tsx can re-fetch /me */
  onComplete: () => void;
  onLogout: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChangePasswordPage({ onComplete, onLogout }: ChangePasswordPageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');

    if (!currentPassword) {
      setError('Enter your current (temporary) password');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      onComplete();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 mb-4">
            <LockIcon />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Change Your Password</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your administrator set a temporary password for you. Please create a new one to continue.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300">
              <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>This is a one-time requirement. You won't be asked again.</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current (Temporary) Password
              </label>
              <input
                type="password"
                placeholder="The password your admin gave you"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Repeat your new password"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onLogout}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Logout instead
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm shadow-blue-600/20 transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Set New Password'
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          Choose a strong password you haven't used elsewhere.
        </p>
      </div>
    </div>
  );
}