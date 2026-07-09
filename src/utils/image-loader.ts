import * as FileSystem from 'expo-file-system/legacy';

export async function deleteCardImages(frontPath: string, backPath: string | null): Promise<void> {
  const tasks = [FileSystem.deleteAsync(frontPath, { idempotent: true })];
  if (backPath) {
    tasks.push(FileSystem.deleteAsync(backPath, { idempotent: true }));
  }
  await Promise.allSettled(tasks);
}
