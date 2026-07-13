import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { Fonts } from '@/constants/fonts';

type PlanTripSheetProps = {
  visible: boolean;
  onClose: () => void;
  containerHeight: number;
};

const ANIMATION_DURATION = 280;
const ANIMATION_EASING = Easing.out(Easing.cubic);
const FLICK_VELOCITY_THRESHOLD = 600;

export function PlanTripSheet({ visible, onClose, containerHeight }: PlanTripSheetProps) {
  const insets = useSafeAreaInsets();

  // The sheet's own height is fixed at its "full" size; dragging only ever
  // moves it via translateY. This lets one continuous drag span all three
  // states (closed / half / full) instead of animating height per-segment.
  const fullHeight = containerHeight - insets.top - 16;
  const halfHeight = containerHeight * 0.5;

  const FULL_Y = 0;
  const HALF_Y = fullHeight - halfHeight;
  const CLOSED_Y = containerHeight;

  const translateY = useSharedValue(CLOSED_Y);
  const dragStartY = useSharedValue(CLOSED_Y);

  useEffect(() => {
    translateY.value = withTiming(visible ? HALF_Y : CLOSED_Y, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleExpanded = () => {
    const target = translateY.value <= (FULL_Y + HALF_Y) / 2 ? HALF_Y : FULL_Y;
    translateY.value = withTiming(target, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const dragGesture = Gesture.Pan()
    .hitSlop({ top: 16, bottom: 16 })
    .onStart(() => {
      'worklet';
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = Math.min(
        CLOSED_Y,
        Math.max(FULL_Y, dragStartY.value + event.translationY),
      );
    })
    .onEnd((event) => {
      'worklet';
      let target: number;
      if (event.velocityY > FLICK_VELOCITY_THRESHOLD) {
        target = translateY.value < HALF_Y ? HALF_Y : CLOSED_Y;
      } else if (event.velocityY < -FLICK_VELOCITY_THRESHOLD) {
        target = translateY.value > HALF_Y ? HALF_Y : FULL_Y;
      } else if (translateY.value < HALF_Y) {
        target = translateY.value < HALF_Y / 2 ? FULL_Y : HALF_Y;
      } else {
        target = translateY.value < HALF_Y + (CLOSED_Y - HALF_Y) / 2 ? HALF_Y : CLOSED_Y;
      }
      translateY.value = withTiming(target, {
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
      });
      if (target === CLOSED_Y) {
        scheduleOnRN(onClose);
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    height: fullHeight,
    transform: [{ translateY: translateY.value }],
  }));

  const expandIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(translateY.value, [FULL_Y, HALF_Y], [0, 180], Extrapolation.CLAMP)}deg` },
    ],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetAnimatedStyle]}
      >
        <GestureDetector gesture={dragGesture}>
          <View style={styles.dragArea}>
            <View style={styles.handle} />
            <Text style={styles.title}>Coming soon</Text>
          </View>
        </GestureDetector>

        <Pressable onPress={toggleExpanded} style={styles.expandButton} hitSlop={10}>
          <Animated.View style={expandIconStyle}>
            <ChevronDownIcon color="#E5D5D5" size={18} />
          </Animated.View>
        </Pressable>

        <Text style={styles.subtitle}>
          This is a placeholder bottom sheet — content to be defined.
        </Text>

        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
          <CloseIcon color="#E5D5D5" size={16} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#272024',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#0B0808',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  dragArea: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    paddingBottom: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#867677',
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34272B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34272B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
    color: '#E5D5D5',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#867677',
  },
});
