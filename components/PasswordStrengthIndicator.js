import { getPasswordStrength } from '@/lib/passwordStrength';

const config = {
  weak: {
    color: 'bg-red-500',
    textColor: 'text-red-600',
  },
  medium: {
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
  },
  strong: {
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
  },
};

export default function PasswordStrengthIndicator({ password, t }) {
  const { level, checks } = getPasswordStrength(password);

  if (!password) return null;

  const cfg = config[level];

  return (
    <div className="mt-2 space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${cfg.color} ${
              level === 'weak' ? 'w-1/3' : level === 'medium' ? 'w-2/3' : 'w-full'
            }`}
          />
        </div>
        <span className={`text-xs font-medium ${cfg.textColor}`}>
          {t(`register.passwordStrength.${level}`)}
        </span>
      </div>
      {/* Checklist */}
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        <li className={checks.length ? 'text-emerald-600' : ''}>
          {checks.length ? '✓' : '○'} {t('register.passwordStrength.minLength')}
        </li>
        <li className={checks.lower ? 'text-emerald-600' : ''}>
          {checks.lower ? '✓' : '○'} {t('register.passwordStrength.lowercase')}
        </li>
        <li className={checks.upper ? 'text-emerald-600' : ''}>
          {checks.upper ? '✓' : '○'} {t('register.passwordStrength.uppercase')}
        </li>
        <li className={checks.number ? 'text-emerald-600' : ''}>
          {checks.number ? '✓' : '○'} {t('register.passwordStrength.number')}
        </li>
        <li className={checks.special ? 'text-emerald-600' : ''}>
          {checks.special ? '✓' : '○'} {t('register.passwordStrength.special')}
        </li>
      </ul>
    </div>
  );
}
