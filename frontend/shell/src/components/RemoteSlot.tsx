import { Component, ComponentType, ReactNode, Suspense, lazy, useCallback, useState } from 'react';
import { type RemoteName, loadRemoteModule, resolveRemoteUrl } from '@boilerplate/fe-shared';

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
        <div role="alert" className="remote-fallback">
          <p>
            Không tải được phần <strong>{this.props.remoteName}</strong> (remote có thể đang
            xuống). Vui lòng thử lại.
          </p>
          <button type="button" onClick={this.props.onRetry}>
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function loadRemote(name: RemoteName, exposedModule: string) {
  const remote = { name, url: resolveRemoteUrl(name) };
  return loadRemoteModule<{ default: ComponentType }>(remote, exposedModule);
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

  // lazy tạo lại theo attempt — retry remount để import chạy từ đầu
  const LazyRemote = lazy(() => loadRemote(name, exposedModule));

  return (
    <RemoteErrorBoundary onRetry={retry} remoteName={name} key={attempt}>
      <Suspense fallback={<p>Đang tải {name}…</p>}>
        <LazyRemote />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
