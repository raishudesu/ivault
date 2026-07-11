import { launchScanner } from "@dariyd/react-native-document-scanner";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import Stack from "expo-router/stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FlipCard } from "@/components/flip-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Radii, Spacing } from "@/constants/theme";
import type { Card } from "@/db/schema";
import { useCards } from "@/hooks/use-cards";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

const SCREEN_WIDTH = Dimensions.get("window").width;

function PageThumb({
  uri,
  index,
  onPress,
  onDelete,
}: {
  uri: string;
  index: number;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const [h, setH] = useState(200);
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  useEffect(() => {
    RNImage.getSize(
      uri,
      (w, imgH) => {
        const maxH = SCREEN_WIDTH - Spacing.four * 2;
        setH(
          Math.min(
            maxH,
            Math.round((imgH / w) * (SCREEN_WIDTH - Spacing.four * 2)),
          ),
        );
      },
      () => setH(200),
    );
  }, [uri]);

  return (
    <View>
      {onDelete && (
        <View style={styles.pageHeader}>
          <ThemedText type="micro" themeColor="gray400">
            page {String(index + 1).padStart(2, "0")}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete page ${index + 1}`}
            hitSlop={8}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.deletePageButton,
              {
                backgroundColor: theme.gray100,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <MaterialIcons
              name="delete-outline"
              size={18}
              color={theme.gray500}
            />
          </Pressable>
        </View>
      )}
      <Pressable onPress={onPress}>
        <Image
          source={{ uri }}
          style={[styles.docImage, { height: h }]}
          contentFit="contain"
        />
      </Pressable>
    </View>
  );
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { getCard, updateCard, deleteCard } = useCards();
  const [card, setCard] = useState<Card | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [kbHeight, setKbHeight] = useState(0);
  const [savingToGallery, setSavingToGallery] = useState(false);
  const [addingPages, setAddingPages] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const allPages = useMemo(() => {
    if (!card) return [];
    if (card.pages) {
      try {
        return JSON.parse(card.pages) as string[];
      } catch {
        return [card.frontImagePath];
      }
    }
    const p = [card.frontImagePath];
    if (card.backImagePath) p.push(card.backImagePath);
    return p;
  }, [card]);

  useEffect(() => {
    if (!id) return;
    const result = getCard(id);
    setCard(result ?? null);
    if (result) {
      setName(result.name);
      setNote(result.note ?? "");
    }
  }, [getCard, id]);

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

  const save = useCallback(() => {
    if (!card) return;
    const trimmedName = name.trim();
    const trimmedNote = note.trim();
    if (!trimmedName) return;
    if (trimmedName === card.name && trimmedNote === (card.note ?? "")) return;
    updateCard(card.id, {
      name: trimmedName,
      note: trimmedNote || null,
    });
    setCard((prev) =>
      prev ? { ...prev, name: trimmedName, note: trimmedNote || null } : null,
    );
  }, [card, name, note, updateCard]);

  const openViewer = useCallback(
    (index: number) => {
      if (!card) return;
      router.push(
        `/viewer?uris=${encodeURIComponent(JSON.stringify(allPages))}&index=${index}`,
      );
    },
    [card, allPages],
  );

  const applyDocumentPages = useCallback(
    (pages: string[]) => {
      if (!card || pages.length === 0) return;
      const imageChanges = {
        frontImagePath: pages[0],
        backImagePath: pages[1] ?? null,
        pages: pages.length > 1 ? JSON.stringify(pages) : null,
      };
      updateCard(card.id, imageChanges);
      setCard((current) => (current ? { ...current, ...imageChanges } : null));
    },
    [card, updateCard],
  );

  if (!card) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <Stack.Screen options={{ title: "card" }} />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ThemedText type="mono">card not found</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddDocumentPages = async () => {
    if (addingPages) return;
    setAddingPages(true);
    try {
      const result = await launchScanner({ quality: 0.8, pageLimit: 10 });
      const images = result.images ?? [];
      if (result.didCancel || result.error || images.length === 0) return;

      const documentsDirectory = FileSystem.documentDirectory;
      if (!documentsDirectory)
        throw new Error("Documents directory unavailable");
      const cardDirectory = `${documentsDirectory}cards/${card.id}/`;
      await FileSystem.makeDirectoryAsync(cardDirectory, {
        intermediates: true,
      });

      const captureId = Date.now().toString(36);
      const addedPages = await Promise.all(
        images.map(async (image, index) => {
          const destination = `${cardDirectory}page_${captureId}_${index}.jpg`;
          await FileSystem.copyAsync({ from: image.uri, to: destination });
          return destination;
        }),
      );

      applyDocumentPages([...allPages, ...addedPages]);
    } catch {
      Alert.alert(
        "unable to add pages",
        "the document scanner could not add these captures.",
      );
    } finally {
      setAddingPages(false);
    }
  };

  const handleDeleteDocumentPage = (index: number) => {
    if (allPages.length <= 1) {
      Alert.alert(
        "cannot delete page",
        "a document must keep at least one capture.",
      );
      return;
    }

    Alert.alert("delete page", `delete page ${index + 1} from this document?`, [
      { text: "cancel", style: "cancel" },
      {
        text: "delete",
        style: "destructive",
        onPress: async () => {
          const pageToDelete = allPages[index];
          const remainingPages = allPages.filter(
            (_, pageIndex) => pageIndex !== index,
          );
          applyDocumentPages(remainingPages);
          await FileSystem.deleteAsync(pageToDelete, { idempotent: true });
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "delete card",
      `are you sure you want to delete "${card.name}"? this cannot be undone.`,
      [
        { text: "cancel", style: "cancel" },
        {
          text: "delete",
          style: "destructive",
          onPress: async () => {
            await deleteCard(card.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleSaveToGallery = async () => {
    setSavingToGallery(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "permission denied",
          "gallery access is needed to save images.",
        );
        return;
      }
      const results = await Promise.allSettled(
        allPages.map((p) => MediaLibrary.saveToLibraryAsync(p)),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      if (succeeded > 0) {
        Alert.alert(
          "saved to gallery",
          `${succeeded} image${succeeded > 1 ? "s" : ""} saved.${failed > 0 ? ` ${failed} failed.` : ""}`,
        );
      } else {
        Alert.alert("error", "failed to save images to gallery.");
      }
    } catch {
      Alert.alert("error", "something went wrong.");
    } finally {
      setSavingToGallery(false);
    }
  };

  const isId = card.category === "id" && !!card.backImagePath;
  const isDocument = card.category === "document";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <Stack.Screen
        options={{
          title: name,
          headerShown: true,
          headerBackTitle: "back",
          headerRight: () => (
            <Pressable
              onPress={handleDelete}
              style={{ marginRight: Spacing.one }}
            >
              <ThemedText type="micro" style={{ color: "#ef4444" }}>
                delete
              </ThemedText>
            </Pressable>
          ),
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.ink,
          headerTitleStyle: {
            fontFamily: "GeistMono",
            fontSize: 15,
            fontWeight: 400,
          },
        }}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === "android" && {
              paddingBottom: kbHeight + Spacing.six,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isId ? (
            <View style={styles.cardContainer}>
              <FlipCard
                frontImagePath={card.frontImagePath}
                backImagePath={card.backImagePath!}
                width={320}
                height={202}
              />
            </View>
          ) : (
            <View style={styles.pageList}>
              {allPages.map((uri, i) => (
                <PageThumb
                  key={uri}
                  uri={uri}
                  index={i}
                  onPress={() => openViewer(i)}
                  onDelete={
                    isDocument ? () => handleDeleteDocumentPage(i) : undefined
                  }
                />
              ))}
              {isDocument && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add document captures"
                  disabled={addingPages}
                  onPress={handleAddDocumentPages}
                  style={({ pressed }) => [
                    styles.addPagesButton,
                    {
                      backgroundColor: theme.gray50,
                      borderColor: theme.gray200,
                      opacity: pressed || addingPages ? 0.6 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="add-a-photo"
                    size={20}
                    color={theme.ink}
                  />
                  <ThemedText type="mono">
                    {addingPages ? "opening scanner..." : "add another"}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}

          <ThemedView style={styles.fieldsSection}>
            <ThemedText
              type="micro"
              themeColor="gray400"
              style={styles.fieldLabel}
            >
              name
            </ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={save}
              selectTextOnFocus
              placeholder="card name"
              placeholderTextColor={theme.gray400}
              style={[
                styles.input,
                { color: theme.ink, borderColor: theme.gray200 },
              ]}
            />
            <ThemedText
              type="micro"
              themeColor="gray400"
              style={[styles.fieldLabel, { marginTop: Spacing.three }]}
            >
              note
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              onBlur={save}
              multiline
              blurOnSubmit
              placeholder="add a note..."
              placeholderTextColor={theme.gray400}
              style={[
                styles.input,
                styles.noteInput,
                { color: theme.ink, borderColor: theme.gray200 },
              ]}
            />
            <ThemedText
              type="micro"
              themeColor="gray400"
              style={[styles.fieldLabel, { marginTop: Spacing.three }]}
            >
              category
            </ThemedText>
            <View style={styles.categoryPill}>
              <ThemedText type="micro" style={{ color: theme.gray500 }}>
                {card.category === "id" ? "digital id" : "document"}
              </ThemedText>
            </View>
          </ThemedView>
        </ScrollView>

        <Pressable
          onPress={handleSaveToGallery}
          disabled={savingToGallery}
          style={[
            styles.fab,
            {
              backgroundColor: theme.ink,
              opacity: savingToGallery ? 0.6 : 1,
            },
          ]}
        >
          <ThemedText
            type="micro"
            style={{ color: theme.background, letterSpacing: 1 }}
          >
            {savingToGallery ? "saving..." : "save to gallery"}
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  pageList: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  pageHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.two,
  },
  deletePageButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.pill,
  },
  addPagesButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderRadius: Radii.medium,
    borderCurve: "continuous",
  },
  fieldsSection: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: "#e9e9e9",
  },
  fieldLabel: { letterSpacing: 1 },
  input: {
    fontFamily: "GeistMono",
    fontSize: 13,
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  categoryPill: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.half + 1,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: "#e9e9e9",
  },
  fab: {
    position: "absolute",
    bottom: Spacing.five,
    right: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Radii.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  docImage: {
    width: "100%",
    height: 320,
    borderRadius: Radii.medium,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "#e9e9e9",
    backgroundColor: "#f5f5f5",
  },
});
