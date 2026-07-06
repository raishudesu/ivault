import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { CropEditor } from '@/components/crop-editor';
import { applyPerspectiveWarp } from '@/components/perspective-warp';
import { Colors, Spacing, Radii, Motion } from '@/constants/theme';
import { useCards } from '@/hooks/use-cards';
import { copyImageToStorage } from '@/utils/image-loader';
import { distance, type Point } from '@/utils/geometry';
import * as FileSystem from 'expo-file-system/legacy';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CROP_DISPLAY_WIDTH = 300;
const MAX_OUTPUT_WIDTH = 1200;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function scaleCornersToSource(
  corners: [Point, Point, Point, Point],
  srcWidth: number,
  srcHeight: number
): [Point, Point, Point, Point] {
  const aspect = srcWidth / srcHeight;
  const dispH = CROP_DISPLAY_WIDTH / aspect;
  const sx = srcWidth / CROP_DISPLAY_WIDTH;
  const sy = srcHeight / dispH;
  return corners.map((c) => ({ x: c.x * sx, y: c.y * sy })) as [Point, Point, Point, Point];
}

export default function TransformScreen() {
  const { front, back } = useLocalSearchParams<{ front: string; back: string }>();
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { insertCard } = useCards();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [frontCorners, setFrontCorners] = useState<[Point, Point, Point, Point] | null>(null);
  const [backCorners, setBackCorners] = useState<[Point, Point, Point, Point] | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !front || !back) return;
    const docsDir = FileSystem.documentDirectory;
    if (!docsDir) return;
    setSaving(true);

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    const cardDir = docsDir + 'cards/' + id + '/';
    await FileSystem.makeDirectoryAsync(cardDir, { intermediates: true });

    const frontDest = cardDir + 'front.jpg';
    const backDest = cardDir + 'back.jpg';

    const [frontSize, backSize] = await Promise.all([
      getImageSize(front),
      getImageSize(back),
    ]);

    const warpImage = async (
      uri: string,
      corners: [Point, Point, Point, Point] | null,
      dest: string,
      size: { width: number; height: number }
    ) => {
      if (corners) {
        const srcCorners = scaleCornersToSource(corners, size.width, size.height);
        // Output dimensions follow the card's actual size in the source photo
        // so the warped result keeps the card's aspect ratio.
        const [tl, tr, br, bl] = srcCorners;
        const cardW = (distance(tl, tr) + distance(bl, br)) / 2;
        const cardH = (distance(tl, bl) + distance(tr, br)) / 2;
        const scale = Math.min(1, MAX_OUTPUT_WIDTH / cardW);
        const outputW = Math.max(1, Math.round(cardW * scale));
        const outputH = Math.max(1, Math.round(cardH * scale));
        return applyPerspectiveWarp(uri, srcCorners, outputW, outputH, dest);
      }
      return copyImageToStorage(uri, dest);
    };

    await Promise.all([
      warpImage(front, frontCorners, frontDest, frontSize),
      warpImage(back, backCorners, backDest, backSize),
    ]);

    insertCard({
      id,
      name: name.trim(),
      note: note.trim() || null,
      frontImagePath: frontDest,
      backImagePath: backDest,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    router.replace('/');
  };

  if (!front || !back) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText type="mono">missing images. please retake.</ThemedText>
          <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
            <ThemedText type="micro" themeColor="gray500">go back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="micro" themeColor="gray500">cancel</ThemedText>
        </Pressable>
        <ThemedText type="mono" style={styles.headerTitle}>review & save</ThemedText>
        <Pressable disabled={!name.trim() || saving} onPress={handleSave}>
          <ThemedText
            type="mono"
            style={{ opacity: (!name.trim() || saving) ? 0.4 : 1 }}
          >
            {saving ? 'saving...' : 'save'}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.hairline} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View
          entering={FadeInUp.duration(Motion.entrance).easing(Motion.strongEaseOut)}
        >
          <ThemedText type="micro" themeColor="gray400" style={styles.sectionLabel}>
            01 — front
          </ThemedText>
          <CropEditor key={front} imageUri={front} onCornersChange={setFrontCorners} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp
            .duration(Motion.entrance)
            .delay(Motion.stagger)
            .easing(Motion.strongEaseOut)
          }
        >
          <ThemedText type="micro" themeColor="gray400" style={[styles.sectionLabel, { marginTop: Spacing.section }]}>
            02 — back
          </ThemedText>
          <CropEditor key={back} imageUri={back} onCornersChange={setBackCorners} />
        </Animated.View>

        <Animated.View
          entering={FadeInUp
            .duration(Motion.entrance)
            .delay(Motion.stagger * 2)
            .easing(Motion.strongEaseOut)
          }
          style={styles.form}
        >
          <TextInput
            placeholder="card name (e.g. drivers license)"
            placeholderTextColor={theme.gray400}
            value={name}
            onChangeText={setName}
            selectTextOnFocus
            style={[styles.input, { color: theme.ink, borderColor: theme.gray200 }]}
          />
          <TextInput
            placeholder="note (optional)"
            placeholderTextColor={theme.gray400}
            value={note}
            onChangeText={setNote}
            multiline
            style={[styles.input, styles.noteInput, { color: theme.ink, borderColor: theme.gray200 }]}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerTitle: { fontSize: 14, fontWeight: 500 },
  hairline: { height: 1, backgroundColor: '#e9e9e9' },
  scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five },
  sectionLabel: { marginBottom: Spacing.three, letterSpacing: 1 },
  form: { marginTop: Spacing.section, gap: Spacing.three },
  input: {
    fontFamily: 'GeistMono',
    fontSize: 13,
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
});
