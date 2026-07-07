import { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Radii, Motion } from '@/constants/theme';
import { useCards } from '@/hooks/use-cards';
import * as FileSystem from 'expo-file-system/legacy';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TransformScreen() {
  const { front, back } = useLocalSearchParams<{ front: string; back: string }>();
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { insertCard } = useCards();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !front || !back) return;
    const docsDir = FileSystem.documentDirectory;
    if (!docsDir) return;
    setSaving(true);

    try {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
      const cardDir = docsDir + 'cards/' + id + '/';
      await FileSystem.makeDirectoryAsync(cardDir, { intermediates: true });

      await Promise.all([
        FileSystem.copyAsync({ from: front, to: cardDir + 'front.jpg' }),
        FileSystem.copyAsync({ from: back, to: cardDir + 'back.jpg' }),
      ]);

      insertCard({
        id,
        name: name.trim(),
        note: note.trim() || null,
        frontImagePath: cardDir + 'front.jpg',
        backImagePath: cardDir + 'back.jpg',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      router.replace('/');
    } catch {
      setSaving(false);
    }
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
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, Platform.OS === 'android' && { paddingBottom: kbHeight + Spacing.five }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
          <Animated.View
            entering={FadeInUp.duration(Motion.entrance).easing(Motion.strongEaseOut)}
          >
            <ThemedText type="micro" themeColor="gray400" style={styles.sectionLabel}>
              01 — front
            </ThemedText>
            <Image
              source={{ uri: front }}
              style={styles.preview}
              resizeMode="contain"
            />
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
            <Image
              source={{ uri: back }}
              style={styles.preview}
              resizeMode="contain"
            />
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
              blurOnSubmit
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
  scrollContent: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.five },
  sectionLabel: { marginBottom: Spacing.three, letterSpacing: 1 },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: Radii.small,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#e9e9e9',
    backgroundColor: '#f5f5f5',
  },
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
