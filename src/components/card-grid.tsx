import { FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { CardThumbnail } from '@/components/card-thumbnail';
import { Spacing, Motion } from '@/constants/theme';
import type { Card } from '@/db/schema';

interface CardGridProps {
  cards: Card[];
  scrollEnabled?: boolean;
  layout?: 'grid' | 'list';
}

export function CardGrid({
  cards,
  scrollEnabled = true,
  layout = 'grid',
}: CardGridProps) {
  const isGrid = layout === 'grid';

  return (
    <FlatList
      key={layout}
      data={cards}
      keyExtractor={(item) => item.id}
      numColumns={isGrid ? 2 : 1}
      columnWrapperStyle={isGrid ? styles.row : undefined}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      nestedScrollEnabled
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
            layout={layout}
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
  },
  row: { gap: Spacing.three },
});
