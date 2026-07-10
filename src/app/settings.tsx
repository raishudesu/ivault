import Constants from "expo-constants";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { useThemeMode, type ThemeMode } from "@/contexts/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function RadioRow({
  value,
  label,
  selected,
  onSelect,
  theme,
}: {
  value: ThemeMode;
  label: string;
  selected: boolean;
  onSelect: (v: ThemeMode) => void;
  theme: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <Pressable
      onPress={() => onSelect(value)}
      style={({ pressed }) => [
        styles.radioRow,
        pressed && styles.radioRowPressed,
      ]}
    >
      <ThemedText>{label}</ThemedText>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? theme.ink : theme.gray300 },
        ]}
      >
        {selected && (
          <View style={[styles.radioFill, { backgroundColor: theme.ink }]} />
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { themeMode, setThemeMode } = useThemeMode();
  const scheme = useColorScheme();
  const theme = Colors[scheme];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <ThemedText style={styles.backArrow}>←</ThemedText>
        </Pressable>
        <ThemedText type="title">settings</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <ThemedText
            type="micro"
            themeColor="gray500"
            style={styles.sectionLabel}
          >
            about
          </ThemedText>
          <ThemedView type="gray50" style={styles.card}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.appIcon}
              contentFit="contain"
            />
            <ThemedText type="mono" style={styles.appName}>
              ivault
            </ThemedText>
            <ThemedText themeColor="gray500" style={styles.version}>
              Version {Constants.expoConfig?.version ?? "1.0.0"}
            </ThemedText>
            <View
              style={[styles.divider, { backgroundColor: theme.gray200 }]}
            />
            <ThemedText themeColor="gray500">
              Your Vault for Important Documents
            </ThemedText>
          </ThemedView>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="micro"
            themeColor="gray500"
            style={styles.sectionLabel}
          >
            data privacy
          </ThemedText>
          <ThemedView type="gray50" style={styles.card}>
            <ThemedText>
              IVault is built as an{" "}
              <ThemedText type="mono">offline-first</ThemedText> application.
            </ThemedText>
            <View
              style={[styles.divider, { backgroundColor: theme.gray200 }]}
            />
            <ThemedText themeColor="gray500">
              All your documents and data are stored exclusively on your device.
              Nothing is ever sent to any server, API, or third party. Your data
              stays yours, always.
            </ThemedText>
            <View
              style={[styles.divider, { backgroundColor: theme.gray200 }]}
            />
            <ThemedText themeColor="gray500">
              No accounts, no telemetry, no tracking.
            </ThemedText>
          </ThemedView>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="micro"
            themeColor="gray500"
            style={styles.sectionLabel}
          >
            appearance
          </ThemedText>
          <ThemedView type="gray50" style={styles.card}>
            {THEME_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                value={opt.value}
                label={opt.label}
                selected={themeMode === opt.value}
                onSelect={setThemeMode}
                theme={theme}
              />
            ))}
          </ThemedView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 18,
    lineHeight: 20,
  },
  scroll: {
    padding: Spacing.four,
    paddingBottom: Spacing.section,
    gap: Spacing.section,
  },
  section: {
    gap: Spacing.three,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.one,
  },
  card: {
    borderRadius: Radii.card,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  appName: {
    fontSize: 18,
    lineHeight: 24,
  },
  version: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
  },
  radioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  radioRowPressed: {
    opacity: 0.6,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
