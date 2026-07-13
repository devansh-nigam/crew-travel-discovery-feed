import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
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
  const [isExpanded, setIsExpanded] = useState(false);

  const sheetProgress = useSharedValue(0);
  const expandProgress = useSharedValue(0);
  const dragStartProgress = useSharedValue(0);

  const halfHeight = containerHeight * 0.5;
  const fullHeight = containerHeight - insets.top - 16;
  const expandRange = fullHeight - halfHeight;

  useEffect(() => {
    sheetProgress.value = withTiming(visible ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
    if (!visible) {
      expandProgress.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
      });
      setIsExpanded(false);
    }
  }, [visible, sheetProgress, expandProgress]);

  const toggleExpanded = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    expandProgress.value = withTiming(next ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      dragStartProgress.value = expandProgress.value;
    })
    .onUpdate((event) => {
      'worklet';
      const delta = -event.translationY / expandRange;
      expandProgress.value = Math.min(1, Math.max(0, dragStartProgress.value + delta));
    })
    .onEnd((event) => {
      'worklet';
      let target: number;
      if (event.velocityY < -FLICK_VELOCITY_THRESHOLD) {
        target = 1;
      } else if (event.velocityY > FLICK_VELOCITY_THRESHOLD) {
        target = 0;
      } else {
        target = expandProgress.value > 0.5 ? 1 : 0;
      }
      expandProgress.value = withTiming(target, {
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
      });
      scheduleOnRN(setIsExpanded, target === 1);
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [halfHeight, fullHeight]),
    transform: [{ translateY: interpolate(sheetProgress.value, [0, 1], [containerHeight, 0]) }],
  }));

  const expandIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${180 - expandProgress.value * 180}deg` }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetAnimatedStyle]}
      >
        <GestureDetector gesture={dragGesture}>
          <View style={styles.header}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        <Pressable onPress={toggleExpanded} style={styles.expandButton} hitSlop={10}>
          <Animated.View style={expandIconStyle}>
            <ChevronDownIcon color="#E5D5D5" size={18} />
          </Animated.View>
        </Pressable>

        <Text style={styles.title}>Coming soon</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#867677',
  },
  expandButton: {
    position: 'absolute',
    top: 14,
    right: 20,
    padding: 4,
  },
  closeButton: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
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
