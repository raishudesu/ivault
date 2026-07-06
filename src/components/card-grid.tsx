import { FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { CardThumbnail } from '@/components/card-thumbnail';
import { Spacing, Motion } from '@/constants/theme';
import type { Card } from '@/db/schema';

interface CardGridProps {
  cards: Card[];
}

export function CardGrid({ cards }: CardGridProps) {
  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <Animated.View
          entering={FadeInUp
            .duration(Motion.entrance)
            .delay(50 + index * Motion.stagger)
            .easing(Motion.strongEaseOut)
          }
          style={{ flex: 1 }}
        >
          <CardThumbnail
            frontImagePath={item.frontImagePath}
            name={item.name}
            onPress={() => router.push(`/card/${item.id}`)}
          />
        </Animated.View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 100,
  },
  row: { gap: Spacing.three },
});
