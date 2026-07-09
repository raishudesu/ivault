import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Motion } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function EmptyState() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        entering={FadeInUp.duration(Motion.entrance).easing(Motion.strongEaseOut)}
      >
        <ThemedText type="mono" style={styles.title}>vault is empty</ThemedText>
      </Animated.View>
      <Animated.View
        entering={FadeInUp
          .duration(Motion.entrance)
          .delay(Motion.stagger)
          .easing(Motion.strongEaseOut)
        }
      >
        <ThemedText type="mono" themeColor="gray500" style={styles.text}>
          tap below to add your first id or document
        </ThemedText>
      </Animated.View>
      <Animated.View
        entering={FadeInUp
          .duration(Motion.entrance)
          .delay(Motion.stagger * 2)
          .easing(Motion.strongEaseOut)
        }
      >
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.ink, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => router.push('/add')}
        >
          <ThemedText style={[styles.buttonText, { color: theme.background }]}>
            add item
          </ThemedText>
        </Pressable>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: Spacing.two,
  },
  title: { fontSize: 18, fontWeight: 500, letterSpacing: 0.5 },
  text: { textAlign: 'center', lineHeight: 20, fontSize: 13, maxWidth: 220 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: Spacing.three,
  },
  buttonText: {
    fontFamily: 'GeistMono',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
