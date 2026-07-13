import { Canvas, LinearGradient, Text as SkiaText, useFont, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { HeartIcon } from '@/components/icons/HeartIcon';
import { Fonts } from '@/constants/fonts';

const SIGNATURE_FONT_SIZE = 48;
const SIGNATURE_CANVAS_WIDTH = 220;
const SIGNATURE_CANVAS_HEIGHT = 64;

export function FeedFooter() {
  const scale = useSharedValue(1);
  // Skia has its own font-loading system, separate from expo-font — same
  // underlying .ttf file, loaded again here so the gradient shader below
  // can be applied to it directly (plain RN Text has no gradient-fill API).
  const signatureFont = useFont(
    require('@/assets/fonts/proxima-nova-condensed-black-italic.ttf'),
    SIGNATURE_FONT_SIZE,
  );

  useEffect(() => {
    // A "lub-dub" double-beat, then a pause — closer to a real heartbeat than
    // a single smooth pulse.
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.in(Easing.quad) }),
        withTiming(1.18, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 140, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
    );
  }, [scale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={heartStyle}>
        <HeartIcon size={48} color="#FFFFFF" />
      </Animated.View>
      <Text style={styles.title}>Made with love</Text>
      {signatureFont ? (
        <Canvas style={styles.signatureCanvas}>
          <SkiaText x={0} y={SIGNATURE_FONT_SIZE} text="devansh" font={signatureFont}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(SIGNATURE_CANVAS_WIDTH, 0)}
              colors={['#904D4E', '#F5EDEA']}
            />
          </SkiaText>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 56,
    marginLeft: -20,
    paddingLeft: 12,
  },
  title: {
    fontFamily: Fonts.condensedBlackItalic,
    fontSize: 56,
    color: '#F5EDEA',
    textAlign: 'left',
    textTransform: 'lowercase',
  },
  signatureCanvas: {
    width: SIGNATURE_CANVAS_WIDTH,
    height: SIGNATURE_CANVAS_HEIGHT,
  },
});
