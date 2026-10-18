// useCopyToClipboard — copy text qua Clipboard API, trả về [copiedText, copy], pattern usehooks.com/ui.dev.
// copy() → Promise<boolean> (true = thành công); clipboard không khả dụng / bị từ chối → false.
import { useCallback, useState } from 'react';

export function useCopyToClipboard(): readonly [string, (text: string) => Promise<boolean>] {
  const [copiedText, setCopiedText] = useState('');

  const copy = useCallback(async (text: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch {
      return false; // quyền bị từ chối / không phải secure context
    }
  }, []);

  return [copiedText, copy] as const;
}
