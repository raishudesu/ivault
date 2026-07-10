import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Colors, Motion, Radii, Spacing } from "@/constants/theme";
import { useCards } from "@/hooks/use-cards";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

const CATEGORIES = [
  { value: "id" as const, label: "digital id" },
  { value: "document" as const, label: "document" },
];

const SCREEN_WIDTH = Dimensions.get("window").width;

function useImageHeight(uri: string | undefined): number {
  const [height, setHeight] = useState(200);
  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => {
        const maxH = SCREEN_WIDTH - Spacing.four * 2;
        const ratio = h / w;
        setHeight(
          Math.min(maxH, Math.round(ratio * (SCREEN_WIDTH - Spacing.four * 2))),
        );
      },
      () => setHeight(200),
    );
  }, [uri]);
  return height;
}

export default function TransformScreen() {
  const params = useLocalSearchParams<{
    front?: string;
    back?: string;
    pages?: string;
    category?: string;
  }>();
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { insertCard } = useCards();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<"id" | "document">(
    (params.category as "id" | "document") || "id",
  );
  const [saving, setSaving] = useState(false);
  const [saveToGallery, setSaveToGallery] = useState(true);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const pagePaths: string[] = useMemo(() => {
    if (params.pages) {
      try {
        return JSON.parse(params.pages);
      } catch {
        return [];
      }
    }
    const paths: string[] = [];
    if (params.front) paths.push(params.front);
    if (params.back) paths.push(params.back);
    return paths;
  }, [params.pages, params.front, params.back]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const isDoc = category === "document";

  const handleSave = async () => {
    if (!name.trim() || pagePaths.length === 0) return;
    const docsDir = FileSystem.documentDirectory;
    if (!docsDir) return;
    setSaving(true);

    try {
      const id =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
      const cardDir = docsDir + "cards/" + id + "/";
      await FileSystem.makeDirectoryAsync(cardDir, { intermediates: true });

      const savedPages: string[] = [];
      const tasks = pagePaths.map((path, i) => {
        const filename = `page_${i}.jpg`;
        const dest = cardDir + filename;
        savedPages.push(dest);
        return FileSystem.copyAsync({ from: path, to: dest });
      });
      await Promise.all(tasks);

      insertCard({
        id,
        name: name.trim(),
        note: note.trim() || null,
        category,
        frontImagePath: savedPages[0],
        backImagePath: savedPages[1] ?? null,
        pages: savedPages.length > 1 ? JSON.stringify(savedPages) : null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (saveToGallery) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          await Promise.allSettled(
            savedPages.map((p) => MediaLibrary.saveToLibraryAsync(p)),
          );
        }
      }

      router.replace("/");
    } catch {
      setSaving(false);
    }
  };

  if (pagePaths.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ThemedText type="mono">missing image. please retake.</ThemedText>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: Spacing.three }}
          >
            <ThemedText type="micro" themeColor="gray500">
              go back
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="micro" themeColor="gray500">
            cancel
          </ThemedText>
        </Pressable>
        <ThemedText type="mono" style={styles.headerTitle}>
          review & save
        </ThemedText>
        <Pressable disabled={!name.trim() || saving} onPress={handleSave}>
          <ThemedText
            type="mono"
            style={{ opacity: !name.trim() || saving ? 0.4 : 1 }}
          >
            {saving ? "saving..." : "save"}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.hairline} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === "android" && {
            paddingBottom: kbHeight + Spacing.five,
          },
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {pagePaths.map((uri, i) => (
          <PagePreview key={uri} uri={uri} index={i} isDoc={isDoc} />
        ))}

        <Animated.View
          entering={FadeInUp.duration(Motion.entrance)
            .delay(pagePaths.length > 1 ? Motion.stagger * 2 : Motion.stagger)
            .easing(Motion.strongEaseOut)}
          style={styles.form}
        >
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: active ? theme.ink : "transparent",
                      borderColor: active ? theme.ink : theme.gray300,
                    },
                  ]}
                >
                  <ThemedText
                    type="micro"
                    style={{
                      color: active ? theme.background : theme.gray500,
                    }}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            placeholder={
              isDoc
                ? "document name (e.g. birth certificate)"
                : "card name (e.g. drivers license)"
            }
            placeholderTextColor={theme.gray400}
            value={name}
            onChangeText={setName}
            selectTextOnFocus
            style={[
              styles.input,
              { color: theme.ink, borderColor: theme.gray200 },
            ]}
          />
          <TextInput
            placeholder="note (optional)"
            placeholderTextColor={theme.gray400}
            value={note}
            onChangeText={setNote}
            multiline
            blurOnSubmit
            style={[
              styles.input,
              styles.noteInput,
              { color: theme.ink, borderColor: theme.gray200 },
            ]}
          />
          <Pressable
            onPress={() => setSaveToGallery(!saveToGallery)}
            style={[
              styles.togglePill,
              {
                backgroundColor: saveToGallery ? theme.ink : "transparent",
                borderColor: saveToGallery ? theme.ink : theme.gray300,
              },
            ]}
          >
            <ThemedText
              type="micro"
              style={{
                color: saveToGallery ? theme.background : theme.gray500,
              }}
            >
              {saveToGallery ? "✓ save to gallery" : "save to gallery"}
            </ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PagePreview({
  uri,
  index,
  isDoc,
}: {
  uri: string;
  index: number;
  isDoc: boolean;
}) {
  const height = useImageHeight(uri);
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const enterDelay = index * Motion.stagger;

  return (
    <Animated.View
      entering={FadeInUp.duration(Motion.entrance)
        .delay(enterDelay)
        .easing(Motion.strongEaseOut)}
    >
      {!isDoc && (
        <ThemedText
          type="micro"
          themeColor="gray400"
          style={[
            styles.sectionLabel,
            index > 0 && { marginTop: Spacing.section },
          ]}
        >
          {String(index + 1).padStart(2, "0")} —{" "}
          {index === 0 ? "front" : "back"}
        </ThemedText>
      )}
      <Image
        source={{ uri }}
        style={[
          styles.preview,
          {
            height,
            borderColor: theme.gray200,
            backgroundColor: theme.gray100,
          },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerTitle: { fontSize: 14, fontWeight: 500 },
  hairline: { height: 1, backgroundColor: "#e9e9e9" },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  sectionLabel: { marginBottom: Spacing.three, letterSpacing: 1 },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: Radii.small,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "#e9e9e9",
    backgroundColor: "#f5f5f5",
  },
  form: { marginTop: Spacing.section, gap: Spacing.three },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  categoryPill: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  input: {
    fontFamily: "GeistMono",
    fontSize: 13,
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  togglePill: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
});
