// providers — bọc toàn app 1 lần ở main.tsx: UiKitProvider (root design
// system) → QueryClientProvider (TanStack Query, client từ app/query-client) →
// ErrorBoundary (chặn crash trắng màn). Thêm provider mới → xếp lớp trong đây.
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Button, Text, Title, UiKitProvider } from '@wakii/ui-kit';
import { queryClient } from '@/app/query-client';

type ErrorBoundaryState = { error: Error | null };

/** Catch render error của cả cây bên dưới — hiện fallback thay vì trắng màn. */
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Điểm cắm telemetry (Sentry/GLIK…) của bạn
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="grid min-h-screen place-items-center bg-canvas p-6">
          <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-line bg-s1 p-8 text-center">
            <Title level={3}>Có lỗi không mong muốn</Title>
            <Text type="secondary">{error.message}</Text>
            <Button type="primary" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UiKitProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </QueryClientProvider>
    </UiKitProvider>
  );
}
