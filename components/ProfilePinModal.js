import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useResetPinMutation, useSetPinMutation } from '@/store/api/profileApi';
import { useAuth } from '@/context/AuthContext';
import { markPinSessionUnlocked, clearPinSessionStorage } from '@/components/PinSetupModal';
import PinKeypad, { PinDots } from '@/components/PinKeypad';

const initialForm = {
  pin: '',
  confirmPin: '',
  password: '',
  newPin: '',
  confirmNewPin: '',
};

export default function ProfilePinModal({ isOpen, onClose, hasPin, onComplete }) {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  const [pinForm, setPinForm] = useState(initialForm);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [setupPhase, setSetupPhase] = useState('first');
  const [resetPhase, setResetPhase] = useState('pin');
  const resetSubmitLock = useRef(false);
  const setSaveLock = useRef(false);

  const [setPin, { isLoading: pinSetting }] = useSetPinMutation();
  const [resetPin, { isLoading: pinResetting }] = useResetPinMutation();

  const resetFields = useCallback(() => {
    setPinForm(initialForm);
    setSetupPhase('first');
    setResetPhase('pin');
    setShuffleKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetFields();
    }
  }, [isOpen, resetFields]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /** First-time set: go to confirm when 4 digits entered */
  useEffect(() => {
    if (!isOpen || hasPin || setupPhase !== 'first' || pinForm.pin.length !== 4) return;
    setSetupPhase('confirm');
    setShuffleKey((k) => k + 1);
  }, [isOpen, hasPin, setupPhase, pinForm.pin]);

  /** First-time set: auto-save when confirm matches */
  useEffect(() => {
    if (!isOpen || hasPin || setupPhase !== 'confirm' || pinForm.confirmPin.length !== 4 || pinSetting) return;
    if (pinForm.pin !== pinForm.confirmPin) {
      toast.error('PIN and confirmation do not match');
      setPinForm((p) => ({ ...p, confirmPin: '' }));
      setShuffleKey((k) => k + 1);
      return;
    }
    if (setSaveLock.current) return;
    setSaveLock.current = true;
    let cancelled = false;
    (async () => {
      try {
        const result = await setPin({
          pin: pinForm.pin,
          confirmPin: pinForm.confirmPin,
        }).unwrap();
        if (cancelled) return;
        if (result.success) {
          toast.success('PIN set successfully');
          resetFields();
          if (userId) markPinSessionUnlocked(userId);
          await onComplete?.();
          onClose();
        }
      } catch (error) {
        if (cancelled) return;
        toast.error(error?.data?.error || error?.message || 'Failed to set PIN');
      } finally {
        setSaveLock.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    hasPin,
    setupPhase,
    pinForm.pin,
    pinForm.confirmPin,
    pinSetting,
    setPin,
    onComplete,
    onClose,
    resetFields,
    userId,
  ]);

  /** Reset PIN: move to confirm when new PIN complete */
  useEffect(() => {
    if (!isOpen || !hasPin || resetPhase !== 'pin' || pinForm.newPin.length !== 4) return;
    if (!pinForm.password) {
      toast.error('Enter your account password first');
      setPinForm((p) => ({ ...p, newPin: '' }));
      setShuffleKey((k) => k + 1);
      return;
    }
    setResetPhase('confirm');
    setShuffleKey((k) => k + 1);
  }, [isOpen, hasPin, resetPhase, pinForm.newPin, pinForm.password]);

  /** Reset PIN: auto-submit when confirm matches */
  useEffect(() => {
    if (!isOpen || !hasPin || resetPhase !== 'confirm' || pinForm.confirmNewPin.length !== 4 || pinResetting) return;
    if (pinForm.newPin !== pinForm.confirmNewPin) {
      toast.error('PIN mismatch');
      setPinForm((p) => ({ ...p, confirmNewPin: '' }));
      setShuffleKey((k) => k + 1);
      return;
    }
    if (!pinForm.password) return;
    if (resetSubmitLock.current) return;
    resetSubmitLock.current = true;
    let cancelled = false;
    (async () => {
      try {
        const result = await resetPin({
          password: pinForm.password,
          newPin: pinForm.newPin,
          confirmNewPin: pinForm.confirmNewPin,
        }).unwrap();
        if (cancelled) return;
        if (result.success) {
          toast.success('PIN updated successfully');
          clearPinSessionStorage();
          resetFields();
          await onComplete?.();
          onClose();
        }
      } catch (error) {
        if (cancelled) return;
        toast.error(error?.data?.error || error?.message || 'Failed to reset PIN');
      } finally {
        resetSubmitLock.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    hasPin,
    resetPhase,
    pinForm.password,
    pinForm.newPin,
    pinForm.confirmNewPin,
    pinResetting,
    resetPin,
    onComplete,
    onClose,
    resetFields,
  ]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSetupBack = () => {
    setSetupPhase('first');
    setPinForm((p) => ({ ...p, pin: '', confirmPin: '' }));
    setShuffleKey((k) => k + 1);
  };

  const handleResetBack = () => {
    setResetPhase('pin');
    setPinForm((p) => ({ ...p, newPin: '', confirmNewPin: '' }));
    setShuffleKey((k) => k + 1);
  };

  const keypadDisabledSet = pinSetting;
  const keypadDisabledReset = pinResetting || !pinForm.password;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-5 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-pin-modal-title"
      onClick={handleBackdropClick}
    >
      <div
        className="relative my-auto w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 pt-12 sm:pt-6 pb-5 text-white shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
            {hasPin ? 'Update PIN' : 'Security PIN'}
          </p>
          <h2 id="profile-pin-modal-title" className="text-lg sm:text-xl font-bold mt-1 pr-8">
            {hasPin ? 'Change your 4-digit PIN' : 'Set your 4-digit PIN'}
          </h2>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            {hasPin
              ? 'Enter your password, then tap a new PIN twice. Numbers shuffle each time; PIN updates automatically when it matches.'
              : 'Tap your PIN twice to confirm. Order changes each time for privacy; saving runs automatically when both match.'}
          </p>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 px-5 sm:px-6 py-5 sm:py-6 space-y-4">
          {!hasPin ? (
            <>
              {setupPhase === 'confirm' && (
                <button
                  type="button"
                  onClick={handleSetupBack}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  ← Change first PIN
                </button>
              )}
              <div>
                <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  {setupPhase === 'first' ? 'Create PIN' : 'Confirm PIN'}
                </p>
                <PinDots
                  length={setupPhase === 'first' ? pinForm.pin.length : pinForm.confirmPin.length}
                  variant="indigo"
                />
                {pinSetting && (
                  <p className="text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                    Saving…
                  </p>
                )}
              </div>
              <PinKeypad
                value={setupPhase === 'first' ? pinForm.pin : pinForm.confirmPin}
                onChange={(v) =>
                  setPinForm((p) =>
                    setupPhase === 'first' ? { ...p, pin: v } : { ...p, confirmPin: v }
                  )
                }
                disabled={keypadDisabledSet}
                shuffleKey={shuffleKey}
                variant="indigo"
              />
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Account password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pinForm.password}
                  onChange={(e) => setPinForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 min-h-[48px] text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-shadow"
                  placeholder="Your login password"
                />
              </div>

              {resetPhase === 'confirm' && (
                <button
                  type="button"
                  onClick={handleResetBack}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  ← Change new PIN
                </button>
              )}

              <div>
                <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  {!pinForm.password
                    ? 'Enter password above to unlock keypad'
                    : resetPhase === 'pin'
                      ? 'New PIN'
                      : 'Confirm new PIN'}
                </p>
                <PinDots
                  length={resetPhase === 'pin' ? pinForm.newPin.length : pinForm.confirmNewPin.length}
                  variant="indigo"
                />
                {pinResetting && (
                  <p className="text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                    Updating…
                  </p>
                )}
              </div>

              <PinKeypad
                value={resetPhase === 'pin' ? pinForm.newPin : pinForm.confirmNewPin}
                onChange={(v) =>
                  setPinForm((p) =>
                    resetPhase === 'pin' ? { ...p, newPin: v } : { ...p, confirmNewPin: v }
                  )
                }
                disabled={keypadDisabledReset}
                shuffleKey={shuffleKey}
                variant="indigo"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
