import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { Radii } from '@/constants/theme';

interface CardFaceProps {
  imagePath: string;
  rotation: SharedValue<number>;
  face: 'front' | 'back';
}

export function CardFace({ imagePath, rotation, face }: CardFaceProps) {
  const isFront = face === 'front';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(rotation.value, [0, 1], isFront ? [0, 180] : [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  return (
    <Animated.View style={[styles.face, animatedStyle]}>
      <Image source={{ uri: imagePath }} style={styles.image} contentFit="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: Radii.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});
