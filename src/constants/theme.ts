import { Easing } from 'react-native-reanimated';

export const Colors = {
  light: {
    background: '#ffffff',
    ink: '#0a0a0a',
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#e9e9e9',
    gray300: '#d4d4d4',
    gray400: '#a3a3a3',
    gray500: '#737373',
  },
  dark: {
    background: '#0c0c0f',
    ink: '#f4f4f5',
    gray50: '#18181b',
    gray100: '#1e1e22',
    gray200: '#2a2a30',
    gray300: '#3a3a42',
    gray400: '#8a8a92',
    gray500: '#a0a0a8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  body: 'Geist',
  mono: 'GeistMono',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  section: 56,
} as const;

export const Radii = {
  card: 16,
  medium: 12,
  small: 8,
  input: 6,
  pill: 999,
} as const;

export const Motion = {
  strongEaseOut: Easing.bezier(0.16, 1, 0.3, 1),
  micro: 200,
  cardHover: 350,
  entrance: 700,
  stagger: 70,
} as const;
