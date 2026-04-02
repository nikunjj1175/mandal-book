import { useEffect } from 'react';

/**
 * Discourages casual inspect / DevTools (right-click, common shortcuts).
 * Not foolproof—menu and extensions can still open tools. Production only.
 */
export default function AntiInspectGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return undefined;
    }

    const stopContext = (e) => {
      e.preventDefault();
    };

    const stopDevtoolsKeys = (e) => {
      if (e.code === 'F12') {
        e.preventDefault();
        return;
      }
      // Chrome/Edge/Firefox: Ctrl+Shift+I/J/C/K
      if (e.ctrlKey && e.shiftKey && ['KeyI', 'KeyJ', 'KeyC', 'KeyK'].includes(e.code)) {
        e.preventDefault();
        return;
      }
      // macOS Chrome: Cmd+Alt+I/J/C
      if (e.metaKey && e.altKey && ['KeyI', 'KeyJ', 'KeyC'].includes(e.code)) {
        e.preventDefault();
        return;
      }
      // View source (Ctrl+U / Cmd+Opt+U in some browsers)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', stopContext, { capture: true });
    document.addEventListener('keydown', stopDevtoolsKeys, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', stopContext, { capture: true });
      document.removeEventListener('keydown', stopDevtoolsKeys, { capture: true });
    };
  }, []);

  return null;
}
