import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import AuthControls from './AuthControls';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          <span className="gradient-text text-lg sm:text-xl">Mandal Book</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}