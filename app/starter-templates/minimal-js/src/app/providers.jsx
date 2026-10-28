// providers — bọc toàn app 1 lần ở main.jsx: UiKitProvider (root design
// system — scope theme/token) + ErrorBoundary (chặn crash trắng màn).
// Thêm provider mới (query client, i18n, auth context…) → xếp lớp trong đây,
// main.jsx giữ nguyên.
import { Component } from 'react';
import { Button, Text, Title, UiKitProvider } from '@wakii/ui-kit';

/** Catch render error của cả cây bên dưới — hiện fallback thay vì trắng màn. */
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
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

export function Providers({ children }) {
  return (
    <UiKitProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </UiKitProvider>
  );
}
