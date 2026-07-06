import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as FileSystem from 'expo-file-system/legacy';

function createSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export default function CaptureScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const sessionIdRef = useRef(createSessionId());
  const sessionDirRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const cache = FileSystem.cacheDirectory;
      if (!cache) return;
      const sessionDir = cache + 'capture/' + sessionIdRef.current + '/';
      sessionDirRef.current = sessionDir;
      await FileSystem.makeDirectoryAsync(sessionDir, { intermediates: true });
    })();
  }, []);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <ThemedText type="title" style={styles.permissionTitle}>camera access</ThemedText>
          <ThemedText themeColor="gray500" style={styles.permissionText}>
            ivaul needs camera access to scan your id cards. all processing happens on-device.
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.permissionButton,
              { backgroundColor: theme.ink, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: theme.background }]}>
              grant permission
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const capture = async () => {
    if (!cameraReady || capturing) return;
    const sessionDir = sessionDirRef.current;
    if (!sessionDir) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (!photo) return;

      if (!frontUri) {
        const tempPath = sessionDir + 'front.jpg';
        await FileSystem.copyAsync({ from: photo.uri, to: tempPath });
        setFrontUri(tempPath);
      } else {
        const backPath = sessionDir + 'back.jpg';
        await FileSystem.copyAsync({ from: photo.uri, to: backPath });
        router.replace({ pathname: '/transform', params: { front: frontUri, back: backPath } });
      }

      await FileSystem.deleteAsync(photo.uri, { idempotent: true });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="picture"
        selectedLens="builtInWideAngleCamera"
        onCameraReady={() => setCameraReady(true)}
      />
      <Pressable style={[styles.closeButton, { top: insets.top + 12 }]} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.guide} />
        <Text style={styles.guideText}>
          {frontUri ? 'capture back side' : 'align id within frame'}
        </Text>
      </View>
      <View style={[styles.bottomBar, { bottom: insets.bottom + 24 }]}>
        <Pressable
          style={({ pressed }) => [{ opacity: (!cameraReady || capturing || pressed) ? 0.5 : 1 }]}
          disabled={!cameraReady || capturing}
          onPress={capture}
        >
          <View style={styles.captureOuter}>
            <View style={styles.captureInner} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: 500 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 24, zIndex: 5 },
  guide: {
    width: '80%',
    aspectRatio: 1.586,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  guideText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: Fonts.mono,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: { fontSize: 24, textAlign: 'center' },
  permissionText: { textAlign: 'center', lineHeight: 20, fontSize: 13, fontFamily: 'GeistMono' },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  permissionButtonText: {
    fontSize: 13,
    fontFamily: 'GeistMono',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: 500,
  },
});
