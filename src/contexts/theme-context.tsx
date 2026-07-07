import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';

export type ThemeMode = 'light' | 'dark' | 'system';

function settingsFile(): File {
  return new File(Paths.document, 'settings', 'theme-mode.json');
}

function settingsDir(): Directory {
  return new Directory(Paths.document, 'settings');
}

async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const file = settingsFile();
    if (file.exists) {
      const content = await file.text();
      return JSON.parse(content) as ThemeMode;
    }
  } catch {}
  return 'system';
}

function persistThemeMode(mode: ThemeMode) {
  try {
    settingsDir().create({ intermediates: true });
    const file = settingsFile();
    file.create({ overwrite: true });
    file.write(JSON.stringify(mode));
  } catch {}
}

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedColorScheme: 'light' | 'dark';
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme() ?? 'light';
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadThemeMode().then(setThemeModeState);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    persistThemeMode(mode);
  };

  const resolvedColorScheme = themeMode === 'system' ? systemScheme : themeMode;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, resolvedColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}
