// query-client — MỘT instance dùng chung app (module singleton). Defaults hơi
// "kín": 30s stale (không refetch ơi thường), retry 1 lần, không refetch khi
// quay lại tab — app CRUD cơ bản không cần agresive. Tune theo app của bạn.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
