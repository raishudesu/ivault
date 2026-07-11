import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radii } from '@/constants/theme';

interface CardThumbnailProps {
  frontImagePath: string;
  name: string;
  onPress: () => void;
  layout?: 'grid' | 'list';
}

export function CardThumbnail({
  frontImagePath,
  name,
  onPress,
  layout = 'grid',
}: CardThumbnailProps) {
  const isList = layout === 'list';

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.container, isList && styles.listContainer]}
      onPress={onPress}
    >
      <ThemedView type="gray50" style={[styles.card, isList && styles.listCard]}>
        <Image source={{ uri: frontImagePath }} style={styles.image} contentFit="cover" />
      </ThemedView>
      <ThemedText
        type="mono"
        numberOfLines={1}
        style={[styles.name, isList && styles.listName]}
      >
        {name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: Spacing.three },
  card: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: Radii.medium,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9e9e9',
    boxShadow: '0 8 22 -14 rgba(0,0,0,0.25)',
  },
  image: { width: '100%', height: '100%' },
  name: {
    fontSize: 12,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  listCard: {
    width: 112,
    flexShrink: 0,
  },
  listName: {
    flex: 1,
    marginTop: 0,
    paddingHorizontal: 0,
    fontSize: 14,
  },
});
