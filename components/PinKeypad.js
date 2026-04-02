import { useState, useEffect } from 'react';

function shuffleDigits() {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const accentStyles = {
  emerald: {
    digit:
      'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-[0.97]',
    back:
      'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97]',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    dotEmpty: 'bg-slate-200 dark:bg-slate-600',
  },
  indigo: {
    digit:
      'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-600 active:scale-[0.97]',
    back:
      'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97]',
    dot: 'bg-indigo-600 dark:bg-indigo-400',
    dotEmpty: 'bg-slate-200 dark:bg-slate-600',
  },
};

/** 4 filled dots for current PIN length */
export function PinDots({ length, maxLength = 4, variant = 'emerald' }) {
  const a = accentStyles[variant] || accentStyles.emerald;
  return (
    <div
      className="flex justify-center gap-3 sm:gap-4 mb-2"
      role="status"
      aria-label={`${length} of ${maxLength} digits entered`}
    >
      {Array.from({ length: maxLength }, (_, i) => (
        <span
          key={i}
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full transition-all duration-200 ${
            i < length ? a.dot : `${a.dotEmpty} opacity-70`
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Shuffled 0–9 keypad; layout reshuffles whenever `shuffleKey` changes.
 */
export default function PinKeypad({
  value,
  onChange,
  maxLength = 4,
  disabled = false,
  shuffleKey = 0,
  variant = 'emerald',
}) {
  const [layout, setLayout] = useState(() => shuffleDigits());

  useEffect(() => {
    setLayout(shuffleDigits());
  }, [shuffleKey]);

  const a = accentStyles[variant] || accentStyles.emerald;
  const firstNine = layout.slice(0, 9);
  const tenth = layout[9];

  const append = (d) => {
    if (disabled || value.length >= maxLength) return;
    onChange(value + String(d));
  };

  const back = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const btnBase =
    'rounded-2xl border-2 font-semibold text-xl sm:text-2xl min-h-[52px] sm:min-h-[56px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <div className="select-none touch-manipulation">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {firstNine.map((digit) => (
          <button
            key={`${shuffleKey}-${digit}`}
            type="button"
            className={`${btnBase} ${a.digit}`}
            onClick={() => append(digit)}
            disabled={disabled}
          >
            {digit}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
        <button
          type="button"
          className={`${btnBase} ${a.back} flex items-center justify-center text-2xl sm:text-3xl font-medium`}
          onClick={back}
          disabled={disabled || value.length === 0}
          aria-label="Delete last digit"
        >
          ⌫
        </button>
        <button
          type="button"
          className={`${btnBase} ${a.digit}`}
          onClick={() => append(tenth)}
          disabled={disabled}
        >
          {tenth}
        </button>
        <div className="min-h-[52px] sm:min-h-[56px]" aria-hidden />
      </div>
    </div>
  );
}
