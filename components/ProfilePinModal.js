import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  useResetPinMutation,
  useSetPinMutation,
} from '@/store/api/profileApi';
import { useAuth } from '@/context/AuthContext';
import {
  markPinSessionUnlocked,
  clearPinSessionStorage,
} from '@/components/PinSetupModal';

const digitInputClass =
  'w-full max-w-[220px] sm:max-w-xs mx-auto block text-center text-xl sm:text-2xl font-semibold tracking-[0.35em] sm:tracking-[0.4em] rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-3 sm:py-3.5 min-h-[48px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-shadow';

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
  const [setPin, { isLoading: pinSetting }] = useSetPinMutation();
  const [resetPin, { isLoading: pinResetting }] = useResetPinMutation();

  const resetFields = useCallback(() => {
    setPinForm(initialForm);
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

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    try {
      const result = await setPin({
        pin: pinForm.pin,
        confirmPin: pinForm.confirmPin,
      }).unwrap();
      if (result.success) {
        toast.success('PIN set successfully');
        resetFields();
        if (userId) markPinSessionUnlocked(userId);
        await onComplete?.();
        onClose();
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to set PIN');
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    try {
      const result = await resetPin({
        password: pinForm.password,
        newPin: pinForm.newPin,
        confirmNewPin: pinForm.confirmNewPin,
      }).unwrap();
      if (result.success) {
        toast.success('PIN updated successfully');
        clearPinSessionStorage();
        resetFields();
        await onComplete?.();
        onClose();
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.message || 'Failed to reset PIN');
    }
  };

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
              ? 'Enter your account password, then choose a new PIN. You will confirm your new PIN on next login.'
              : 'Choose a PIN you will remember. It protects sensitive areas and is asked once per browser session after login.'}
          </p>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 px-5 sm:px-6 py-5 sm:py-6">
          {!hasPin ? (
            <form onSubmit={handleSetPin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={pinForm.pin}
                  onChange={(e) =>
                    setPinForm((p) => ({
                      ...p,
                      pin: e.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  className={digitInputClass}
                  placeholder="••••"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={pinForm.confirmPin}
                  onChange={(e) =>
                    setPinForm((p) => ({
                      ...p,
                      confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  className={digitInputClass}
                  placeholder="••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={pinSetting || pinForm.pin.length !== 4 || pinForm.confirmPin.length !== 4}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 min-h-[48px] shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {pinSetting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Save PIN'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPin} className="space-y-5">
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
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={4}
                    value={pinForm.newPin}
                    onChange={(e) =>
                      setPinForm((p) => ({
                        ...p,
                        newPin: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    className={digitInputClass}
                    placeholder="••••"
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm new PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={4}
                    value={pinForm.confirmNewPin}
                    onChange={(e) =>
                      setPinForm((p) => ({
                        ...p,
                        confirmNewPin: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    className={digitInputClass}
                    placeholder="••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={
                  pinResetting ||
                  !pinForm.password ||
                  pinForm.newPin.length !== 4 ||
                  pinForm.confirmNewPin.length !== 4
                }
                className="w-full rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 font-semibold py-3.5 min-h-[48px] hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {pinResetting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-indigo-400/40 border-t-indigo-600 dark:border-t-indigo-300 rounded-full animate-spin" />
                    Updating…
                  </span>
                ) : (
                  'Update PIN'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
