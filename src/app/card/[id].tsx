import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Stack from 'expo-router/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FlipCard } from '@/components/flip-card';
import { Colors, Spacing } from '@/constants/theme';
import { useCards } from '@/hooks/use-cards';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Card } from '@/db/schema';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { getCard, deleteCard } = useCards();
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    if (!id) return;
    const result = getCard(id);
    setCard(result ?? null);
  }, [id]);

  if (!card) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'card' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText type="mono">card not found</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'delete card',
      `are you sure you want to delete "${card.name}"? this cannot be undone.`,
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCard(card.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: card.name,
          headerShown: true,
          headerBackTitle: 'back',
          headerRight: () => (
            <Pressable onPress={handleDelete} style={{ marginRight: Spacing.one }}>
              <ThemedText type="micro" style={{ color: '#ef4444' }}>delete</ThemedText>
            </Pressable>
          ),
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.ink,
          headerTitleStyle: { fontFamily: 'GeistMono', fontSize: 15, fontWeight: 400 },
        }}
      />

      <View style={styles.cardContainer}>
        <FlipCard
          frontImagePath={card.frontImagePath}
          backImagePath={card.backImagePath}
          width={320}
          height={202}
        />
      </View>

      {card.note && (
        <ThemedView style={styles.noteSection}>
          <ThemedText type="micro" themeColor="gray400" style={styles.noteLabel}>
            note
          </ThemedText>
          <ThemedText type="mono" themeColor="gray500" selectable>
            {card.note}
          </ThemedText>
        </ThemedView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  noteSection: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#e9e9e9',
  },
  noteLabel: { letterSpacing: 1 },
});
