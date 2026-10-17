import { Component, ComponentType, ReactNode, Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { type LoadRemoteModuleOptions, type RemoteName, loadRemoteModule, resolveRemoteUrl } from '@wakii/fe-shared';
import { Skeleton } from '@wakii/ui-kit';

/**
 * Slot load 1 remote (conventions/08 registry) vào layout.
 * Remote down / load fail → error boundary hiện fallback + retry — KHÔNG trắng trang
 * (spec slice mục 7; remote thật là việc SF-6, host-side chỉ cần sẵn slot).
 */

interface RemoteErrorBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
  remoteName: string;
}
class RemoteErrorBoundary extends Component<RemoteErrorBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="sh-remote-fallback" role="alert">
          <p>
            Không tải được phần <strong>{this.props.remoteName}</strong> (remote có thể đang
            xuống). Vui lòng thử lại.
          </p>
          <button className="sh-btn sh-btn--ghost" type="button" onClick={this.props.onRetry}>
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function loadRemote(name: RemoteName, exposedModule: string, options?: LoadRemoteModuleOptions) {
  const remote = { name, url: resolveRemoteUrl(name) };
  return loadRemoteModule<{ default: ComponentType }>(remote, exposedModule, options);
}

export function RemoteSlot({
  name,
  exposedModule,
}: {
  name: RemoteName;
  exposedModule: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  // lazy cache theo (module, attempt) — re-render KHÔNG tạo component type mới (tránh remount
  // + Suspense flash khi click lại nav link đang đứng); retry đổi attempt → lazy mới → import lại.
  // attempt > 0 = lần retry (BUG-2, sf-5b): mang cờ retry để fe-shared bust sticky rejection
  // trong MF runtime (registerRemotes force) — nếu không, runtime trả lại rejection cũ tức thì
  // dù remote đã sống lại (0 network request mới), "Thử lại" không bao giờ ăn.
  const LazyRemote = useMemo(
    () => lazy(() => loadRemote(name, exposedModule, attempt > 0 ? { retry: true } : undefined)),
    [name, exposedModule, attempt],
  );

  return (
    <RemoteErrorBoundary onRetry={retry} remoteName={name} key={attempt}>
      <Suspense
        fallback={
          <div className="sh-slot-loading">
            <Skeleton variant="card" count={2} />
          </div>
        }
      >
        <LazyRemote />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
