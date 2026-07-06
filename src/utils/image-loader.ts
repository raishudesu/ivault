import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Skia } from '@shopify/react-native-skia';

const PROCESSING_WIDTH = 400;

export async function loadImagePixels(
  uri: string
): Promise<{ pixels: Uint8Array; width: number; height: number } | null> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: PROCESSING_WIDTH } }],
      { format: ImageManipulator.SaveFormat.JPEG }
    );

    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const data = Skia.Data.fromBase64(base64);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) return null;

    const cpuImage = image.makeNonTextureImage();
    const info = cpuImage.getImageInfo();
    const pixels = cpuImage.readPixels(0, 0, info);
    if (!pixels) return null;

    const raw = pixels instanceof Uint8Array ? pixels : new Uint8Array(pixels.buffer);
    return { pixels: raw, width: info.width, height: info.height };
  } catch {
    return null;
  }
}

export async function copyImageToStorage(
  sourceUri: string,
  destPath: string
): Promise<string> {
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return destPath;
}

export async function deleteCardImages(frontPath: string, backPath: string): Promise<void> {
  await Promise.allSettled([
    FileSystem.deleteAsync(frontPath, { idempotent: true }),
    FileSystem.deleteAsync(backPath, { idempotent: true }),
  ]);
}
