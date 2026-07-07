import * as FileSystem from 'expo-file-system/legacy';

export async function deleteCardImages(frontPath: string, backPath: string): Promise<void> {
  await Promise.allSettled([
    FileSystem.deleteAsync(frontPath, { idempotent: true }),
    FileSystem.deleteAsync(backPath, { idempotent: true }),
  ]);
}
