"use client";
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === 'dark';
  return (
    <button
      aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}