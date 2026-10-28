// Standalone render (split from index.tsx so the entry stays a pure async boundary).
// This file NEVER runs in-shell: the host owns global CSS and providers there, and
// imports the exposed page directly.
import './styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { {{remoteName}}Page } from './{{remoteName}}Page';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root not found in index.html');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

createRoot(container).render(
  // Standalone has no host — provide its own QueryClientProvider. In-shell the host
  // supplies one; react-query is an MF singleton so the context carries over.
  <StrictMode>
    <aside className="m-4 max-w-[720px] rounded-2 border border-line border-l-[3px] border-l-accent bg-s2 p-3 px-4 text-label text-ink2">
      <strong className="font-mono text-ink">Standalone debug — remote `{{appName}}`</strong>
      <p className="mt-1">
        The real surface is the exposed `./{{remoteName}}Page`, mounted by the MF host.
        Swap the demo data in <code>src/{{remoteName}}Page.tsx</code> for your own API —
        see README → "Plug into a Wakii stack".
      </p>
    </aside>
    <QueryClientProvider client={queryClient}>
      <{{remoteName}}Page />
    </QueryClientProvider>
  </StrictMode>,
);
