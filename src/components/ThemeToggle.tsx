"use client";
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg border border-gray-300 bg-gray-100 animate-pulse"></div>
    );
  }
  
  const isDark = theme === 'dark';
  
  return (
    <button
      aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
      className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Sun size={18} className="text-yellow-500" />
      ) : (
        <Moon size={18} className="text-gray-600" />
      )}
    </button>
  );
}