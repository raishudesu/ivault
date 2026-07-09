import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { Radii, Spacing } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function ZoomableImage({ uri, onNext, onPrev }: { uri: string; onNext?: () => void; onPrev?: () => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value <= 1) {
        const dx = e.translationX;
        const dy = e.translationY;
        if (Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 40) {
          if (dx < 0 && onNext) runOnJS(onNext)();
          if (dx > 0 && onPrev) runOnJS(onPrev)();
        }
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const panAndPinch = Gesture.Simultaneous(pan, pinch);
  const composed = Gesture.Race(doubleTap, panAndPinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.zoomContainer, animatedStyle]}>
        <Image
          source={{ uri }}
          style={styles.zoomImage}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

export default function ViewerScreen() {
  const { uris, index: indexStr } = useLocalSearchParams<{ uris: string; index?: string }>();
  const [page, setPage] = useState(Number(indexStr) || 0);

  const allUris = useMemo(() => {
    try { return JSON.parse(uris) as string[]; } catch { return []; }
  }, [uris]);

  const goNext = () => setPage((p) => Math.min(p + 1, allUris.length - 1));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));

  if (allUris.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />

      <ZoomableImage
        uri={allUris[page]}
        onNext={page < allUris.length - 1 ? goNext : undefined}
        onPrev={page > 0 ? goPrev : undefined}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeLabel}>close</Text>
        </Pressable>
      </View>

      {allUris.length > 1 && (
        <View style={styles.pagination}>
          {allUris.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === page ? '#fff' : 'rgba(255,255,255,0.4)' },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  zoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: Spacing.four,
    zIndex: 10,
  },
  closeBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLabel: {
    color: '#fff',
    fontFamily: 'GeistMono',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pagination: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
