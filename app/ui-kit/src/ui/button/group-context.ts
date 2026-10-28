// Shared context so ButtonGroup can push size/type defaults into child Buttons.
// Type-only import from index keeps this module runtime-cycle-free.
import { createContext, useContext } from 'react';
import type { ButtonSize, ButtonType } from './index.js';

export interface ButtonGroupContextValue {
  size?: ButtonSize;
  type?: ButtonType;
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue>({});
export const useButtonGroup = () => useContext(ButtonGroupContext);
