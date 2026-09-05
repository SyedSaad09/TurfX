import { useState, useEffect, useCallback } from 'react';

export interface RouteState {
  path: string;
  params: Record<string, string>;
}

function parseHash(): RouteState {
  const hash = window.location.hash.slice(1) || '/';
  return { path: hash, params: {} };
}

export function useRouter() {
  const [route, setRoute] = useState<RouteState>(parseHash());

  useEffect(() => {
    const handler = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  return { route, navigate };
}

export function navigateTo(path: string) {
  window.location.hash = path;
}
