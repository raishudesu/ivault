import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'body' | 'title' | 'micro' | 'mono' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'ink'] },
        type === 'body' && styles.body,
        type === 'title' && styles.title,
        type === 'micro' && styles.micro,
        type === 'mono' && styles.mono,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: 'Geist',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 400,
  },
  title: {
    fontFamily: 'GeistMono',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: 400,
    textTransform: 'lowercase',
  },
  micro: {
    fontFamily: 'GeistMono',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: 400,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: 'GeistMono',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 400,
  },
  code: {
    fontFamily: 'GeistMono',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 400,
  },
});
