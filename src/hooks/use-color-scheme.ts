import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { ThemeContext } from '@/contexts/theme-context';

export function useColorScheme() {
  const ctx = useContext(ThemeContext);
  const system = useRNColorScheme() ?? 'light';
  return ctx ? ctx.resolvedColorScheme : system;
}
