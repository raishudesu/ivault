import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import { Image } from 'expo-image';

import { Spacing, Radii } from '@/constants/theme';
import { Point, defaultCorners } from '@/utils/geometry';
import { loadImagePixels } from '@/utils/image-loader';
import { detectCardEdges } from '@/utils/edge-detector';
import { ThemedText } from '@/components/themed-text';

interface CropEditorProps {
  imageUri: string;
  onCornersChange: (corners: [Point, Point, Point, Point]) => void;
}

const HANDLE_SIZE = 20;
const HANDLE_OVERFLOW = 22;
const CROP_BORDER_WIDTH = 2;

interface DragState {
  index: number;
  startX: number;
  startY: number;
  cornerStartX: number;
  cornerStartY: number;
}

function CropBorder({ corners, imageSize }: { corners: [Point, Point, Point, Point]; imageSize: { width: number; height: number } }) {
  const edges: { len: number; angle: number; left: number; top: number }[] = [];

  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    edges.push({
      len: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx),
      left: a.x,
      top: a.y,
    });
  }

  const overlayEdges = [
    { x: 0, y: 0, w: corners[0].x, h: imageSize.height },
    { x: corners[1].x, y: 0, w: imageSize.width - corners[1].x, h: imageSize.height },
    { x: 0, y: 0, w: imageSize.width, h: corners[0].y },
    { x: 0, y: corners[2].y, w: imageSize.width, h: imageSize.height - corners[2].y },
  ];

  return (
    <>
      {edges.map((e, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: e.left,
            top: e.top,
            width: e.len,
            height: CROP_BORDER_WIDTH,
            backgroundColor: '#fff',
            transform: [{ rotate: e.angle + 'rad' }],
            transformOrigin: 'left center',
          }}
        />
      ))}
      {overlayEdges.map((r, i) => (
        <View
          key={'o' + i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
            backgroundColor: 'rgba(0,0,0,0.25)',
          }}
        />
      ))}
    </>
  );
}

export function CropEditor({ imageUri, onCornersChange }: CropEditorProps) {
  const [imageSize, setImageSize] = useState({ width: 300, height: 190 });
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>(() => [...defaultCorners(300, 190)]);
  const [detecting, setDetecting] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const cornersRef = useRef(corners);
  cornersRef.current = corners;
  // PanResponders are created once, so they must read the size via a ref
  // to avoid clamping drags to the pre-load placeholder size (300x190).
  const imageSizeRef = useRef(imageSize);
  imageSizeRef.current = imageSize;

  useEffect(() => {
    onCornersChange(corners);
  }, [corners, onCornersChange]);

  useEffect(() => {
    setLoaded(false);
    setDetecting(true);
    setImageSize({ width: 300, height: 190 });
    setCorners(defaultCorners(300, 190));
  }, [imageUri]);

  useEffect(() => {
    if (!loaded) return;

    (async () => {
      setDetecting(true);
      const result = await loadImagePixels(imageUri);
      if (result) {
        const detected = detectCardEdges(result.pixels, result.width, result.height);
        if (detected) {
          const scaleX = imageSize.width / result.width;
          const scaleY = imageSize.height / result.height;
          const scaled = detected.map((p) => ({
            x: p.x * scaleX,
            y: p.y * scaleY,
          })) as [Point, Point, Point, Point];
          setCorners(scaled);
        }
      }
      setDetecting(false);
    })();
  }, [imageUri, loaded]);

  const cornerPanResponders = useRef(
    [0, 1, 2, 3].map((index) =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const cur = cornersRef.current[index];
          dragRef.current = {
            index,
            startX: evt.nativeEvent.pageX,
            startY: evt.nativeEvent.pageY,
            cornerStartX: cur.x,
            cornerStartY: cur.y,
          };
        },
        onPanResponderMove: (_, gesture: PanResponderGestureState) => {
          const drag = dragRef.current;
          if (!drag) return;
          const newX = Math.max(0, Math.min(imageSizeRef.current.width, drag.cornerStartX + gesture.dx));
          const newY = Math.max(0, Math.min(imageSizeRef.current.height, drag.cornerStartY + gesture.dy));
          setCorners((prev) => {
            const next = [...prev] as [Point, Point, Point, Point];
            next[drag.index] = { x: newX, y: newY };
            return next;
          });
        },
        onPanResponderRelease: () => { dragRef.current = null; },
      })
    )
  ).current;

  return (
    <View style={styles.container}>
      <View style={[styles.imageWrapper, { width: imageSize.width + HANDLE_OVERFLOW * 2, height: imageSize.height + HANDLE_OVERFLOW * 2 }]}>
        <View style={[styles.imageClip, { left: HANDLE_OVERFLOW, top: HANDLE_OVERFLOW, width: imageSize.width, height: imageSize.height }]}>
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            contentFit="contain"
            cachePolicy="none"
            onLoad={(e) => {
              const w = e.source.width;
              const h = e.source.height;
              const aspect = w / h;
              const dispW = 300;
              const dispH = dispW / aspect;
              setImageSize({ width: dispW, height: dispH });
              setCorners(defaultCorners(dispW, dispH));
              setLoaded(true);
            }}
          />
        </View>

        <View style={{ position: 'absolute', left: HANDLE_OVERFLOW, top: HANDLE_OVERFLOW, width: imageSize.width, height: imageSize.height }}>
          <CropBorder corners={corners} imageSize={imageSize} />
        </View>

        {corners.map((corner, index) => (
          <View
            key={index}
            style={[
              styles.handle,
              {
                left: corner.x,
                top: corner.y,
              },
            ]}
            {...cornerPanResponders[index].panHandlers}
          >
            <View style={styles.handleDot} />
          </View>
        ))}

        {detecting && (
          <View style={styles.detectingOverlay}>
            <ThemedText type="mono" style={{ color: '#fff' }}>detecting edges...</ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center' },
  imageWrapper: {
    borderRadius: Radii.small,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#e9e9e9',
  },
  imageClip: {
    position: 'absolute',
    borderRadius: Radii.small,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  handle: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  handleDot: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: '#0a0a0a',
    boxShadow: '0 2 6 -2 rgba(0,0,0,0.3)',
  },
  detectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
