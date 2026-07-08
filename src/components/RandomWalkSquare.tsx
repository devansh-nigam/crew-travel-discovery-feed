import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const SQUARE_SIZE = 56;
const MOVE_DURATION_MS = 900;
const EASING = Easing.inOut(Easing.quad);

export function RandomWalkSquare() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const goToRandomPoint = () => {
    if (!isRunningRef.current) {
      return;
    }
    const maxOffsetX = Math.max(width / 2 - SQUARE_SIZE / 2, 0);
    const maxOffsetY = Math.max(height / 2 - SQUARE_SIZE / 2, 0);
    const targetX = (Math.random() * 2 - 1) * maxOffsetX;
    const targetY = (Math.random() * 2 - 1) * maxOffsetY;

    translateX.value = withTiming(targetX, { duration: MOVE_DURATION_MS, easing: EASING });
    translateY.value = withTiming(
      targetY,
      { duration: MOVE_DURATION_MS, easing: EASING },
      (finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(goBackToStart);
        }
      },
    );
  };

  const goBackToStart = () => {
    if (!isRunningRef.current) {
      return;
    }
    translateX.value = withTiming(0, { duration: MOVE_DURATION_MS, easing: EASING });
    translateY.value = withTiming(
      0,
      { duration: MOVE_DURATION_MS, easing: EASING },
      (finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(goToRandomPoint);
        }
      },
    );
  };

  const toggleAnimation = () => {
    if (isRunningRef.current) {
      isRunningRef.current = false;
      setIsRunning(false);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      translateX.value = withTiming(0, { duration: MOVE_DURATION_MS, easing: EASING });
      translateY.value = withTiming(0, { duration: MOVE_DURATION_MS, easing: EASING });
      return;
    }
    isRunningRef.current = true;
    setIsRunning(true);
    goToRandomPoint();
  };

  const squareStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.squareAnchor} pointerEvents="none">
        <Animated.View style={[styles.square, squareStyle]} />
      </View>
      <Pressable onPress={toggleAnimation} style={[styles.button, { bottom: insets.bottom + 24 }]}>
        <Text style={styles.buttonText}>{isRunning ? 'Stop' : 'Start'} Animation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  squareAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -SQUARE_SIZE / 2,
    marginTop: -SQUARE_SIZE / 2,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 10,
    backgroundColor: '#904D4E',
  },
  button: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2D2338',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  buttonText: {
    color: '#E5D5D5',
    fontSize: 14,
    fontWeight: '600',
  },
});
