import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CardFace } from '@/components/card-face';
import { ThemedView } from '@/components/themed-view';
import { Radii } from '@/constants/theme';

const CARD_WIDTH = 300;
const CARD_HEIGHT = 190;

interface FlipCardProps {
  frontImagePath: string;
  backImagePath: string;
  width?: number;
  height?: number;
}

export function FlipCard({ frontImagePath, backImagePath, width = CARD_WIDTH, height = CARD_HEIGHT }: FlipCardProps) {
  const rotation = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      rotation.value = isFlipped.value
        ? 1 + Math.max(-1, Math.min(event.translationX / width, 1))
        : Math.max(-1, Math.min(event.translationX / width, 1));
    })
    .onEnd((event) => {
      const shouldFlip = Math.abs(event.translationX) > width * 0.3 || Math.abs(event.velocityX) > 500;
      if (shouldFlip) {
        const target = isFlipped.value ? 0 : 1;
        rotation.value = withSpring(target, { damping: 18, stiffness: 120 });
        isFlipped.value = !isFlipped.value;
      } else {
        rotation.value = withSpring(isFlipped.value ? 1 : 0, { damping: 18, stiffness: 120 });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    const target = isFlipped.value ? 0 : 1;
    rotation.value = withTiming(target, { duration: 350 });
    isFlipped.value = !isFlipped.value;
  });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  return (
    <GestureDetector gesture={composed}>
      <ThemedView style={[styles.container, { width, height }]}>
        <CardFace imagePath={frontImagePath} rotation={rotation} face="front" />
        <CardFace imagePath={backImagePath} rotation={rotation} face="back" />
      </ThemedView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.card,
    borderCurve: 'continuous',
    boxShadow: '0 8 22 -14 rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: '#e9e9e9',
  },
});
