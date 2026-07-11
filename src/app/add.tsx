import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Colors, Motion, Radii, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const OPTIONS = [
  {
    type: "id" as const,
    title: "digital id",
    description: "front & back — drivers license, passport, national id",
    icon: "01",
  },
  {
    type: "document" as const,
    title: "document",
    description: "single page — certificate, letter, agreement",
    icon: "02",
  },
];

export default function AddScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss add to vault"
        accessibilityHint="Drag the sheet down or tap outside to dismiss"
        hitSlop={12}
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.dismissHint,
          pressed && { opacity: 0.5 },
        ]}
      >
        <MaterialIcons
          name="keyboard-arrow-down"
          size={42}
          color={theme.gray400}
        />
      </Pressable>

      <View style={styles.content}>
        {OPTIONS.map((opt, i) => (
          <Animated.View
            key={opt.type}
            entering={FadeInUp.duration(Motion.entrance)
              .delay(i * Motion.stagger)
              .easing(Motion.strongEaseOut)}
          >
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.gray50,
                  borderColor: theme.gray200,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push(`/capture?type=${opt.type}`)}
            >
              <ThemedText
                type="mono"
                themeColor="gray400"
                style={styles.cardIcon}
              >
                {opt.icon}
              </ThemedText>
              <ThemedText type="mono" style={styles.cardTitle}>
                {opt.title}
              </ThemedText>
              <ThemedText
                type="mono"
                themeColor="gray500"
                style={styles.cardDesc}
              >
                {opt.description}
              </ThemedText>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  dismissHint: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 32,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.five,
    borderRadius: Radii.medium,
    borderCurve: "continuous",
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardIcon: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 500,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});
