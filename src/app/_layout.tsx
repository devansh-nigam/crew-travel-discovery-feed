import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Fonts } from '@/constants/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [Fonts.light]: require('@/assets/fonts/proxima-nova-light.ttf'),
    [Fonts.lightItalic]: require('@/assets/fonts/proxima-nova-light-italic.ttf'),
    [Fonts.regular]: require('@/assets/fonts/proxima-nova-regular.ttf'),
    [Fonts.regularItalic]: require('@/assets/fonts/proxima-nova-regular-italic.ttf'),
    [Fonts.medium]: require('@/assets/fonts/proxima-nova-medium.ttf'),
    [Fonts.semibold]: require('@/assets/fonts/proxima-nova-semibold.ttf'),
    [Fonts.semiboldItalic]: require('@/assets/fonts/proxima-nova-semibold-italic.ttf'),
    [Fonts.bold]: require('@/assets/fonts/proxima-nova-bold.ttf'),
    [Fonts.condensedBlackItalic]: require('@/assets/fonts/proxima-nova-condensed-black-italic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
