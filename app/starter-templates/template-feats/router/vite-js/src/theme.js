import { useEffect } from 'react';
import { useLocalStorage } from '@wakii/ui-kit';

const STORAGE_KEY = 'app-theme';

/**
 * Dark/light toggle của app — copy pattern app/shell NavBar (useHostTheme) +
 * app/admin AdminLayout: useLocalStorage persist + đặt `data-bp-theme` trên
 * documentElement. ui-kit dark.css override toàn bộ token theo attribute này —
 * mọi component kit (và utilities Tailwind map token) đổi theme tức thì, không JS thêm.
 */
export function useAppTheme() {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEY, 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-bp-theme', theme);
    return () => document.documentElement.removeAttribute('data-bp-theme');
  }, [theme]);

  return { theme, setTheme };
}
