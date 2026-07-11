import * as FileSystem from 'expo-file-system/legacy';

export async function deleteCardImages(imagePaths: string[]): Promise<void> {
  const tasks = imagePaths.map((path) =>
    FileSystem.deleteAsync(path, { idempotent: true })
  );
  await Promise.allSettled(tasks);
}
