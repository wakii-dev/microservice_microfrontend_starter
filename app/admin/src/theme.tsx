// ThemeProvider — dark/light TOÀN APP qua UiKitProvider (theming 2): state mode
// persist localStorage (key 'admin-theme' giữ từ batch ⑦), UiKitProvider nhận
// theme prop → attr data-bp-theme trên scope con (KHÔNG đụng documentElement như
// bản cũ — consumer nào nằm trong subtree cũng ăn nhờ cascade CSS var, cùng cơ chế
// dark preview của Templates/Settings). 1 click ở Header/Sidebar/Giao diện → toàn
// app đổi + chart palette re-resolve (useChartTheme MutationObserver body subtree).
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { UiKitProvider, useLocalStorage } from '@wakii/ui-kit';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
});

/** mode hiện tại + setMode/toggle — dùng trong Header, Sidebar footer, Settings. */
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useLocalStorage<ThemeMode>('admin-theme', 'light');
  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggle: () => setMode(mode === 'dark' ? 'light' : 'dark') }),
    [mode, setMode],
  );
  return (
    <ThemeContext.Provider value={value}>
      <UiKitProvider theme={mode}>{children}</UiKitProvider>
    </ThemeContext.Provider>
  );
}
