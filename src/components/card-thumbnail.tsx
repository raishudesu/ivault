import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radii } from '@/constants/theme';

interface CardThumbnailProps {
  frontImagePath: string;
  name: string;
  onPress: () => void;
}

export function CardThumbnail({ frontImagePath, name, onPress }: CardThumbnailProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <ThemedView type="gray50" style={styles.card}>
        <Image source={{ uri: frontImagePath }} style={styles.image} contentFit="cover" />
      </ThemedView>
      <ThemedText type="mono" numberOfLines={1} style={styles.name}>{name}</ThemedText>
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
});
