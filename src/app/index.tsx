import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp, Easing } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardGrid } from '@/components/card-grid';
import { EmptyState } from '@/components/empty-state';
import { Colors, Spacing, Motion } from '@/constants/theme';
import { useCards } from '@/hooks/use-cards';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { cards, loading } = useCards();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">ivault</ThemedText>
        <ThemedText themeColor="gray500" style={styles.subtitle}>
          digital id cards
        </ThemedText>
        <View style={styles.hairline} />
      </View>

      {!loading && cards.length === 0 ? (
        <EmptyState />
      ) : (
        <CardGrid cards={cards} />
      )}

      {cards.length > 0 && (
        <Animated.View
          entering={FadeInUp
            .duration(Motion.entrance)
            .easing(Motion.strongEaseOut)
          }
        >
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.ink, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push('/capture')}
          >
            <ThemedText style={[styles.fabText, { color: theme.background }]}>+</ThemedText>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
  },
  subtitle: {
    fontFamily: 'GeistMono',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hairline: {
    height: 1,
    backgroundColor: '#e9e9e9',
    marginTop: Spacing.three,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: Spacing.four,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4 12 -6 rgba(0,0,0,0.3)',
  },
  fabText: {
    fontFamily: 'Geist',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: 500,
  },
});
