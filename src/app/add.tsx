import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Stack from 'expo-router/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Radii, Motion } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const OPTIONS = [
  {
    type: 'id' as const,
    title: 'digital id',
    description: 'front & back — drivers license, passport, national id',
    icon: '01',
  },
  {
    type: 'document' as const,
    title: 'document',
    description: 'single page — certificate, letter, agreement',
    icon: '02',
  },
];

export default function AddScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'add to vault',
          headerBackTitle: 'back',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.ink,
          headerTitleStyle: { fontFamily: 'GeistMono', fontSize: 15, fontWeight: 400 },
        }}
      />

      <View style={styles.content}>
        {OPTIONS.map((opt, i) => (
          <Animated.View
            key={opt.type}
            entering={FadeInUp
              .duration(Motion.entrance)
              .delay(i * Motion.stagger)
              .easing(Motion.strongEaseOut)
            }
          >
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.gray50,
                  borderColor: theme.gray200,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push(`/capture?type=${opt.type}`)}
            >
              <ThemedText type="mono" themeColor="gray400" style={styles.cardIcon}>
                {opt.icon}
              </ThemedText>
              <ThemedText type="mono" style={styles.cardTitle}>
                {opt.title}
              </ThemedText>
              <ThemedText type="mono" themeColor="gray500" style={styles.cardDesc}>
                {opt.description}
              </ThemedText>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.five,
    borderRadius: Radii.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardIcon: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 500,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});
