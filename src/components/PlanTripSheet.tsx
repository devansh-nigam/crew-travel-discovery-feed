import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
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
import { PlanTripChat } from '@/components/chat/PlanTripChat';
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
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // revealAmount is how many pixels of the sheet are currently visible from
  // the bottom of the screen, from 0 (closed) up to fullHeight (fully open).
  // Below halfHeight, the sheet's *height* stays pinned at halfHeight and
  // translateY slides it down to hide the excess (closed <-> half). At or
  // above halfHeight, translateY is 0 and height itself grows (half <-> full)
  // — so the sheet's rendered height always equals what's actually on
  // screen, and bottom-pinned content (like the chat input) never ends up
  // below the visible fold the way it would if height stayed fixed at
  // fullHeight with translateY alone doing the hiding.
  const fullHeight = containerHeight - insets.top - 16;
  const halfHeight = containerHeight * 0.5;

  const revealAmount = useSharedValue(0);
  const dragStartReveal = useSharedValue(0);

  useEffect(() => {
    revealAmount.value = withTiming(visible ? halfHeight : 0, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const toggleExpanded = () => {
    Haptics.selectionAsync();
    const midpoint = (halfHeight + fullHeight) / 2;
    const target = revealAmount.value < midpoint ? fullHeight : halfHeight;
    if (target === halfHeight) {
      dismissKeyboard();
    }
    revealAmount.value = withTiming(target, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const expandToFull = () => {
    revealAmount.value = withTiming(fullHeight, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  // Every path that leaves the sheet at half height or fully closed funnels
  // through these so the keyboard never gets left open over too little (or
  // no) sheet to show it against.
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissKeyboard();
    onClose();
  };

  const dragGesture = Gesture.Pan()
    .hitSlop({ top: 16, bottom: 16 })
    .onStart(() => {
      'worklet';
      dragStartReveal.value = revealAmount.value;
    })
    .onUpdate((event) => {
      'worklet';
      revealAmount.value = Math.min(
        fullHeight,
        Math.max(0, dragStartReveal.value - event.translationY),
      );
    })
    .onEnd((event) => {
      'worklet';
      let target: number;
      if (event.velocityY < -FLICK_VELOCITY_THRESHOLD) {
        target = revealAmount.value < halfHeight ? halfHeight : fullHeight;
      } else if (event.velocityY > FLICK_VELOCITY_THRESHOLD) {
        target = revealAmount.value > halfHeight ? halfHeight : 0;
      } else if (revealAmount.value < halfHeight) {
        target = revealAmount.value < halfHeight / 2 ? 0 : halfHeight;
      } else {
        target = revealAmount.value < halfHeight + (fullHeight - halfHeight) / 2 ? halfHeight : fullHeight;
      }
      revealAmount.value = withTiming(target, {
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
      });
      if (target === 0) {
        scheduleOnRN(handleClose);
      } else if (target === halfHeight) {
        scheduleOnRN(dismissKeyboard);
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    height: Math.max(halfHeight, revealAmount.value),
    transform: [{ translateY: halfHeight - Math.min(revealAmount.value, halfHeight) }],
  }));

  const expandIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(revealAmount.value, [halfHeight, fullHeight], [180, 0], Extrapolation.CLAMP)}deg` },
    ],
  }));

  // Driven by the same Reanimated/UI-thread pipeline as the sheet's own
  // drag animation, instead of KeyboardAvoidingView (which adjusts layout
  // via JS-thread state) — the two systems fighting each other was the
  // source of the keyboard-open glitching.
  const chatWrapperAnimatedStyle = useAnimatedStyle(() => ({
    // The sheet itself already reserves insets.bottom (line below) for the
    // home-indicator area, so subtract it here to avoid padding that sliver
    // twice on top of the keyboard's own height.
    paddingBottom: Math.max(0, Math.abs(keyboardHeight.value) - insets.bottom),
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetAnimatedStyle]}
      >
        <GestureDetector gesture={dragGesture}>
          <View style={styles.dragArea}>
            <View style={styles.handle} />
            <Text style={styles.title}>Trip Assistant</Text>
          </View>
        </GestureDetector>

        <Pressable onPress={toggleExpanded} style={styles.expandButton} hitSlop={10}>
          <Animated.View style={expandIconStyle}>
            <ChevronDownIcon color="#E5D5D5" size={18} />
          </Animated.View>
        </Pressable>

        <Animated.View style={[styles.chatWrapper, chatWrapperAnimatedStyle]}>
          <PlanTripChat onInputFocus={expandToFull} />
        </Animated.View>

        <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={10}>
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
    fontSize: 15,
    color: '#E5D5D5',
  },
  chatWrapper: {
    flex: 1,
  },
});
