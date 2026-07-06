import { useMemo } from 'react';
import { Canvas, FilterMode, Image as SkiaImage, ImageFormat, MipmapMode, Skia, useImage } from '@shopify/react-native-skia';
import { View, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { Point, computePerspectiveTransform } from '@/utils/geometry';

interface PerspectiveWarpProps {
  sourceUri: string;
  corners: [Point, Point, Point, Point];
  outputWidth: number;
  outputHeight: number;
}

export function PerspectiveWarp({ sourceUri, corners, outputWidth, outputHeight }: PerspectiveWarpProps) {
  const skImage = useImage(sourceUri);
  const matrix = useMemo(
    () => computePerspectiveTransform(corners, outputWidth, outputHeight),
    [corners, outputWidth, outputHeight]
  );

  if (!skImage) return <View style={[styles.placeholder, { width: outputWidth, height: outputHeight }]} />;

  return (
    <Canvas style={{ width: outputWidth, height: outputHeight }}>
      <SkiaImage
        image={skImage}
        x={0}
        y={0}
        width={skImage.width()}
        height={skImage.height()}
        fit="fill"
        matrix={matrix}
      />
    </Canvas>
  );
}

export async function applyPerspectiveWarp(
  sourceUri: string,
  corners: [Point, Point, Point, Point],
  outputWidth: number,
  outputHeight: number,
  destPath?: string
): Promise<string> {
  const matrix = computePerspectiveTransform(corners, outputWidth, outputHeight);

  const base64 = await FileSystem.readAsStringAsync(sourceUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const data = Skia.Data.fromBase64(base64);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Failed to decode source image');

  const surface = Skia.Surface.MakeOffscreen(outputWidth, outputHeight);
  if (!surface) throw new Error('Failed to create offscreen surface');

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('white'));
  canvas.save();
  canvas.concat(matrix);
  canvas.drawImageOptions(image, 0, 0, FilterMode.Linear, MipmapMode.Linear);
  canvas.restore();
  surface.flush();

  const snapshot = surface.makeImageSnapshot();
  const base64Result = snapshot.encodeToBase64(ImageFormat.JPEG, 90);
  if (!base64Result) throw new Error('Failed to encode warped image');

  const outputPath = destPath ?? ((FileSystem.cacheDirectory ?? '') + 'warped_' + Date.now() + '.jpg');
  await FileSystem.writeAsStringAsync(outputPath, base64Result, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return outputPath;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
