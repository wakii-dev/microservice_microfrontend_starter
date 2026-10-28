// theme.js — dark/light toggle toàn app, copy pattern shell NavBar (batch ⑰):
// useLocalStorage persist + đặt data-bp-theme trên documentElement → CSS tokens
// cascade toàn cây (component kit ăn theo tự động, không cần code riêng).
import { useEffect } from 'react';
import { useLocalStorage } from '@wakii/ui-kit';

/** Theme hiện tại + setter — persist localStorage `app-theme`, sync `<html data-bp-theme>`. */
export function useAppTheme() {
  const [theme, setTheme] = useLocalStorage('app-theme', 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-bp-theme', theme);
  }, [theme]);
  return { theme, setTheme };
}
