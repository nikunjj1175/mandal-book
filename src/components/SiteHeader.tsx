import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import AuthControls from './AuthControls';

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Mandal Book
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}