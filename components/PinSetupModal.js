import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSetPinMutation, useVerifyPinMutation } from '@/store/api/profileApi';
import { useAuth } from '@/context/AuthContext';

const SESSION_KEY = 'pinSessionUnlocked';

function readSessionUnlocked(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === String(userId);
  } catch {
    return false;
  }
}

function writeSessionUnlocked(userId) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    sessionStorage.setItem(SESSION_KEY, String(userId));
  } catch {
    /* ignore */
  }
}

/**
 * 1) First visit: set 4-digit PIN (once).
 * 2) Later sessions: enter PIN once per browser session to unlock the app.
 *    Wrong attempts are logged server-side (see PIN history).
 */
export default function PinSetupModal() {
  const { user, checkAuth } = useAuth();
  const [savePin, { isLoading: savingPin }] = useSetPinMutation();
  const [verifyPin, { isLoading: verifyingPin }] = useVerifyPinMutation();

  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verifyInput, setVerifyInput] = useState('');

  const userId = user?.id || user?._id;

  const syncSession = useCallback(() => {
    setSessionUnlocked(readSessionUnlocked(userId));
  }, [userId]);

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  const needsSetup = Boolean(user && user.hasPin !== true);
  const needsVerify = Boolean(user && user.hasPin === true && !sessionUnlocked);

  const open = Boolean(
    user && user.isActive !== false && user.emailVerified && (needsSetup || needsVerify)
  );

  if (!open) return null;

  const digitClass =
    'w-full max-w-xs mx-auto block text-center text-2xl font-semibold tracking-[0.4em] rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-shadow';

  const handleSetSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4 || confirmPin.length !== 4) {
      toast.error('Enter exactly 4 digits in both fields');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PIN and confirmation do not match');
      return;
    }
    try {
      const result = await savePin({ pin, confirmPin }).unwrap();
      if (result.success) {
        toast.success('PIN saved.');
        setPinValue('');
        setConfirmPin('');
        await checkAuth();
        writeSessionUnlocked(userId);
        setSessionUnlocked(true);
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Could not save PIN');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (verifyInput.length !== 4) {
      toast.error('Enter your 4-digit PIN');
      return;
    }
    try {
      const result = await verifyPin({ pin: verifyInput }).unwrap();
      if (result.success) {
        toast.success('Welcome back');
        setVerifyInput('');
        writeSessionUnlocked(userId);
        setSessionUnlocked(true);
      }
    } catch (error) {
      const msg = error?.data?.error || error?.message || 'Verification failed';
      toast.error(msg);
      setVerifyInput('');
    }
  };

  if (needsVerify) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-verify-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">Security check</p>
            <h2 id="pin-verify-title" className="text-xl font-bold mt-1">
              Enter your PIN
            </h2>
            <p className="text-sm text-emerald-100 mt-2 leading-relaxed">
              For this browser session we ask once. Wrong attempts are recorded like login history.
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                4-digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={digitClass}
                placeholder="••••"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={verifyingPin || verifyInput.length !== 4}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {verifyingPin ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking…
                </span>
              ) : (
                'Unlock app'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-setup-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">First time</p>
          <h2 id="pin-setup-title" className="text-xl font-bold mt-1">
            Set your 4-digit PIN
          </h2>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            This PIN helps protect your account. After this, you will enter it once per session when you log in.
          </p>
        </div>

        <form onSubmit={handleSetSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Enter PIN (4 digits)
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={digitClass}
              placeholder="••••"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={digitClass}
              placeholder="••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPin || pin.length !== 4 || confirmPin.length !== 4}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {savingPin ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              'Save PIN & continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Call after user sets PIN elsewhere (e.g. Profile) so the global PIN gate does not re-prompt. */
export function markPinSessionUnlocked(userId) {
  writeSessionUnlocked(userId);
}

export function clearPinSessionStorage() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
