import { useState } from 'react';
import { performSetup, setToken } from '../api';
import type { SetupPayload } from '../api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const LocationIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupWizardPageProps {
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

const STEPS: { step: Step; label: string; icon: React.ReactNode }[] = [
  { step: 1, label: 'Admin Account', icon: <UserIcon /> },
  { step: 2, label: 'Organization', icon: <BuildingIcon /> },
  { step: 3, label: 'First Branch', icon: <LocationIcon /> },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SetupWizardPage({ onComplete }: SetupWizardPageProps) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Admin
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Organization
  const [companyName, setCompanyName] = useState('');

  // Step 3: First Branch
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  function validateStep(s: Step): string | null {
    if (s === 1) {
      if (!adminName.trim()) return 'Full name is required';
      if (!adminEmail.trim() || !adminEmail.includes('@')) return 'A valid email is required';
      if (adminPassword.length < 6) return 'Password must be at least 6 characters';
      if (adminPassword !== confirmPassword) return 'Passwords do not match';
    }
    if (s === 2) {
      if (!companyName.trim()) return 'Organization name is required';
    }
    if (s === 3) {
      if (!branchName.trim()) return 'Branch name is required';
      if (!branchAddress.trim()) return 'Branch address is required';
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((step + 1) as Step);
  }

  function goBack() {
    setError('');
    setStep((step - 1) as Step);
  }

  async function handleSubmit() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: SetupPayload = {
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword,
        companyName: companyName.trim(),
        branchName: branchName.trim(),
        branchAddress: branchAddress.trim(),
      };

      const res = await performSetup(payload);
      setToken(res.accessToken);
      onComplete();
    } catch (e: any) {
      setError(e?.message ?? 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-4">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome! Let's get started</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Set up your admin account, organization, and first branch.</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map(({ step: s, label }) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold transition-all duration-200 ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {s < step ? <CheckIcon /> : s}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  s === step ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {label}
              </span>
              {s < 3 && (
                <div
                  className={`h-0.5 w-8 rounded-full transition-colors ${
                    s < step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300 mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Admin Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-2.5 text-blue-600 dark:text-blue-400">
                  <UserIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Admin Account</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This will be the super admin for your system.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Sarah Johnson"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@yourcompany.com"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Organization */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-2.5 text-purple-600 dark:text-purple-400">
                  <BuildingIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Organization</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enter the name of your company or practice.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g., Harmony Health Clinic"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-300">
                <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>All branches and staff will be created under this organization.</span>
              </div>
            </div>
          )}

          {/* Step 3: First Branch */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-2.5 text-green-600 dark:text-green-400">
                  <LocationIcon />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">First Branch</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Create your first clinic location. You can add more later.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g., Main Street Clinic"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Branch Address</label>
                <input
                  type="text"
                  placeholder="e.g., 456 Kenyatta Avenue, Nairobi"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 transition-colors"
              >
                Continue
                <ArrowRightIcon />
              </button>
            ) : (
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
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckIcon />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          Step {step} of 3 — You can add more branches and staff after setup.
        </p>
      </div>
    </div>
  );
}