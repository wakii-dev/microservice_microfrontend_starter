// useKeyPress — theo dõi 1 phím: true khi đang giữ, false khi nhả; tuỳ chọn callback khi nhấn, pattern usehooks.com/ui.dev.
// Listener trên window — nhớ nhớ unmount cleanup để không rò rỉ.
import { useEffect, useRef, useState } from 'react';

export function useKeyPress(targetKey: string, onPress?: (event: KeyboardEvent) => void): boolean {
  const [isPressed, setIsPressed] = useState(false);
  const onPressRef = useRef(onPress);

  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== targetKey) return;
      setIsPressed(true);
      onPressRef.current?.(event);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === targetKey) setIsPressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [targetKey]);

  return isPressed;
}
