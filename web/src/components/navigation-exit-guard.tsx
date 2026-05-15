'use client';

import { useEffect } from 'react';

type NavigationExitGuardProps = {
  message?: string;
};

export function NavigationExitGuard({ message = 'Chceš opustit web?' }: NavigationExitGuardProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const marker = { teamVysExitGuard: true };
    window.history.pushState(marker, '', window.location.href);

    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = message;
    }

    function onPopState() {
      const shouldLeave = window.confirm(message);
      if (shouldLeave) {
        window.removeEventListener('beforeunload', beforeUnload);
        window.removeEventListener('popstate', onPopState);
        window.history.back();
        return;
      }

      window.history.pushState(marker, '', window.location.href);
    }

    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [message]);

  return null;
}