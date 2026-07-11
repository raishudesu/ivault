import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CardGrid } from "@/components/card-grid";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { Colors, Motion, Radii, Spacing } from "@/constants/theme";
import { useCards } from "@/hooks/use-cards";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const { cards, loading } = useCards();
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const ids = useMemo(() => cards.filter((c) => c.category === "id"), [cards]);
  const docs = useMemo(
    () => cards.filter((c) => c.category === "document"),
    [cards]
  );
  const hasCards = ids.length > 0 || docs.length > 0;

  const sectionHeader = (label: string) => (
    <View style={styles.sectionHeader}>
      <ThemedText themeColor="gray500" style={styles.sectionLabel}>
        {label}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <ThemedText type="title">ivault</ThemedText>
          <View style={styles.headerActions}>
            {hasCards && (
              <View
                accessibilityRole="radiogroup"
                style={[
                  styles.layoutControl,
                  {
                    backgroundColor: theme.gray100,
                    borderColor: theme.gray200,
                  },
                ]}
              >
                {(["grid", "list"] as const).map((option) => {
                  const selected = layout === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${option} view`}
                      onPress={() => setLayout(option)}
                      style={({ pressed }) => [
                        styles.layoutButton,
                        selected && { backgroundColor: theme.ink },
                        pressed && { opacity: 0.65 },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.layoutButtonText,
                          { color: selected ? theme.background : theme.gray500 },
                        ]}
                      >
                        {option}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Pressable
              onPress={() => router.push("/settings")}
              hitSlop={8}
              style={({ pressed }) => [
                styles.settingsBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <ThemedText style={styles.settingsIcon} themeColor="gray400">
                settings
              </ThemedText>
            </Pressable>
          </View>
        </View>
        <View style={[styles.hairline, { backgroundColor: theme.gray200 }]} />
      </View>

      {!loading && !hasCards ? (
        <EmptyState />
      ) : (
        <ScrollView
          style={styles.scrollArea}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {ids.length > 0 && (
            <View>
              {sectionHeader("digital ids")}
              <CardGrid cards={ids} scrollEnabled={false} layout={layout} />
            </View>
          )}
          {docs.length > 0 && (
            <View>
              {sectionHeader("documents")}
              <CardGrid cards={docs} scrollEnabled={false} layout={layout} />
            </View>
          )}
          {loading && (
            <View style={styles.loadingContainer}>
              <ThemedText type="mono" themeColor="gray400">
                loading...
              </ThemedText>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {hasCards && (
        <Animated.View
          entering={FadeInUp.duration(Motion.entrance).easing(
            Motion.strongEaseOut,
          )}
          style={styles.fabWrapper}
        >
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.ink, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/add")}
          >
            <ThemedText style={[styles.fabText, { color: theme.background }]}>
              +
            </ThemedText>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  layoutControl: {
    flexDirection: "row",
    padding: 2,
    borderRadius: Radii.input,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  layoutButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 4,
    borderCurve: "continuous",
  },
  layoutButtonText: {
    fontFamily: "GeistMono",
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  settingsBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  settingsIcon: {
    fontFamily: "GeistMono",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  hairline: {
    height: 1,
  },
  scrollArea: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionLabel: {
    fontFamily: "GeistMono",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  fabWrapper: {
    position: "absolute",
    bottom: 40,
    right: Spacing.four,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4 12 -6 rgba(0,0,0,0.3)",
  },
  fabText: {
    fontFamily: "Geist",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: 500,
  },
});
