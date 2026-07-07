import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Stack from 'expo-router/stack';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { Text, View } from 'react-native';

import { initDb } from '@/db';
import { ThemeProvider } from '@/contexts/theme-context';

initDb();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist: Geist_400Regular,
    GeistMedium: Geist_500Medium,
    GeistSemiBold: Geist_600SemiBold,
    GeistMono: GeistMono_400Regular,
    GeistMonoMedium: GeistMono_500Medium,
  });

  if (!fontsLoaded) return <View />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="capture"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="transform"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
          <Stack.Screen name="card/[id]" />
          <Stack.Screen
            name="settings"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
