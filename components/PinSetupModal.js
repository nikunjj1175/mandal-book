import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSetPinMutation, useVerifyPinMutation } from '@/store/api/profileApi';
import { useAuth } from '@/context/AuthContext';
import PinKeypad, { PinDots } from '@/components/PinKeypad';

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
 * 1) First visit: set 4-digit PIN (once) — tap keypad, confirm, auto-save when match.
 * 2) Later sessions: enter PIN once per session — 4th digit auto-verifies.
 */
export default function PinSetupModal() {
  const { user, checkAuth } = useAuth();
  const [savePin, { isLoading: savingPin }] = useSetPinMutation();
  const [verifyPin, { isLoading: verifyingPin }] = useVerifyPinMutation();

  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
  const [shuffleKey, setShuffleKey] = useState(0);
  const [setupPhase, setSetupPhase] = useState('first');
  const verifyLock = useRef(false);
  const confirmSaveLock = useRef(false);

  const userId = user?.id || user?._id;

  useEffect(() => {
    setSessionUnlocked(readSessionUnlocked(userId));
  }, [userId]);

  const needsSetup = Boolean(user && user.hasPin !== true);
  const needsVerify = Boolean(user && user.hasPin === true && !sessionUnlocked);

  const open = Boolean(
    user && user.isActive !== false && user.emailVerified && (needsSetup || needsVerify)
  );

  /** After login: auto-verify when 4 digits entered */
  useEffect(() => {
    if (!needsVerify || verifyInput.length !== 4 || verifyLock.current) return;
    verifyLock.current = true;
    let cancelled = false;
    (async () => {
      try {
        const result = await verifyPin({ pin: verifyInput }).unwrap();
        if (cancelled) return;
        if (result.success) {
          toast.success('Welcome back');
          setVerifyInput('');
          writeSessionUnlocked(userId);
          setSessionUnlocked(true);
        }
      } catch (error) {
        if (cancelled) return;
        const msg = error?.data?.error || error?.message || 'Verification failed';
        toast.error(msg);
        setVerifyInput('');
        setShuffleKey((k) => k + 1);
      } finally {
        verifyLock.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsVerify, verifyInput, verifyPin, userId]);

  /** First-time: move to confirm step when first PIN is complete */
  useEffect(() => {
    if (!needsSetup || setupPhase !== 'first' || pin.length !== 4) return;
    setSetupPhase('confirm');
    setShuffleKey((k) => k + 1);
  }, [needsSetup, setupPhase, pin]);

  /** First-time: auto-save when confirm PIN matches */
  useEffect(() => {
    if (!needsSetup || setupPhase !== 'confirm' || confirmPin.length !== 4 || savingPin) return;
    if (pin !== confirmPin) {
      toast.error('PIN and confirmation do not match');
      setConfirmPin('');
      setShuffleKey((k) => k + 1);
      return;
    }
    if (confirmSaveLock.current) return;
    confirmSaveLock.current = true;
    let cancelled = false;
    (async () => {
      try {
        const result = await savePin({ pin, confirmPin }).unwrap();
        if (cancelled) return;
        if (result.success) {
          toast.success('PIN saved.');
          setPinValue('');
          setConfirmPin('');
          setSetupPhase('first');
          await checkAuth();
          writeSessionUnlocked(userId);
          setSessionUnlocked(true);
        }
      } catch (error) {
        if (cancelled) return;
        toast.error(error?.data?.error || error?.message || 'Could not save PIN');
      } finally {
        confirmSaveLock.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsSetup, setupPhase, confirmPin, pin, savingPin, savePin, checkAuth, userId]);

  const handleSetupBack = () => {
    setSetupPhase('first');
    setPinValue('');
    setConfirmPin('');
    setShuffleKey((k) => k + 1);
  };

  if (!open) return null;

  if (needsVerify) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-verify-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 sm:px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">Security check</p>
            <h2 id="pin-verify-title" className="text-xl font-bold mt-1">
              Enter your PIN
            </h2>
            <p className="text-sm text-emerald-100 mt-2 leading-relaxed">
              Tap the numbers below. Order changes each time. Your PIN is checked automatically after 4 digits.
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <PinDots length={verifyInput.length} variant="emerald" />
              {verifyingPin && (
                <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Checking…
                </p>
              )}
            </div>

            <PinKeypad
              value={verifyInput}
              onChange={setVerifyInput}
              disabled={verifyingPin}
              shuffleKey={shuffleKey}
              variant="emerald"
            />
          </div>
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">First time</p>
          <h2 id="pin-setup-title" className="text-xl font-bold mt-1">
            Set your 4-digit PIN
          </h2>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            {setupPhase === 'first'
              ? 'Tap 4 digits. Number positions are shuffled for privacy.'
              : 'Enter the same PIN again to confirm. It saves automatically when both match.'}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {setupPhase === 'confirm' && (
            <button
              type="button"
              onClick={handleSetupBack}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              ← Change first PIN
            </button>
          )}

          <div className="min-h-[28px]">
            <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              {setupPhase === 'first' ? 'Create PIN' : 'Confirm PIN'}
            </p>
            <PinDots length={setupPhase === 'first' ? pin.length : confirmPin.length} variant="indigo" />
            {savingPin && (
              <p className="text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                Saving…
              </p>
            )}
          </div>

          <PinKeypad
            value={setupPhase === 'first' ? pin : confirmPin}
            onChange={setupPhase === 'first' ? setPinValue : setConfirmPin}
            disabled={savingPin}
            shuffleKey={shuffleKey}
            variant="indigo"
          />
        </div>
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
