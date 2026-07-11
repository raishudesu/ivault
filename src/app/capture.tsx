import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { launchScanner } from '@dariyd/react-native-document-scanner';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as FileSystem from 'expo-file-system/legacy';

function createSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export default function CaptureScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { type } = useLocalSearchParams<{ type?: string }>();
  const captureType = type === 'document' ? 'document' : 'id';
  const sessionIdRef = useRef(createSessionId());
  const launchedRef = useRef(false);

  useEffect(() => {
    if (launchedRef.current) return;
    launchedRef.current = true;

    (async () => {
      try {
        const cache = FileSystem.cacheDirectory;
        if (!cache) { router.back(); return; }
        const sessionDir = cache + 'capture/' + sessionIdRef.current + '/';
        await FileSystem.makeDirectoryAsync(sessionDir, { intermediates: true });

        const pageLimit = captureType === 'id' ? 1 : 10;
        const frontResult = await launchScanner({ quality: 0.8, pageLimit });
        if (frontResult.didCancel || frontResult.error || !frontResult.images?.length) {
          router.back();
          return;
        }

        if (captureType === 'document') {
          const pages: string[] = [];
          for (let i = 0; i < frontResult.images.length; i++) {
            const dest = sessionDir + `page_${i}.jpg`;
            await FileSystem.copyAsync({ from: frontResult.images[i].uri, to: dest });
            pages.push(dest);
          }
          router.replace({
            pathname: '/transform',
            params: { pages: JSON.stringify(pages), category: 'document' },
          });
          return;
        }

        const frontUri = frontResult.images[0].uri;
        const frontTemp = sessionDir + 'front.jpg';
        await FileSystem.copyAsync({ from: frontUri, to: frontTemp });

        const backResult = await launchScanner({ quality: 0.8, pageLimit: 1 });
        if (backResult.didCancel || backResult.error || !backResult.images?.length) {
          router.back();
          return;
        }
        const backUri = backResult.images[0].uri;
        const backTemp = sessionDir + 'back.jpg';
        await FileSystem.copyAsync({ from: backUri, to: backTemp });

        router.replace({ pathname: '/transform', params: { front: frontTemp, back: backTemp, category: 'id' } });
      } catch {
        router.back();
      }
    })();
  }, [captureType]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <ThemedText type="mono">opening scanner...</ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
