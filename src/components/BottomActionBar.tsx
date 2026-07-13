import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { Fonts } from '@/constants/fonts';

export const BAR_HEIGHT = 52;

const PRESS_IN_DURATION = 90;
const PRESS_OUT_DURATION = 180;
const PRESS_EASING = Easing.out(Easing.quad);

type BottomActionBarProps = {
  label: string;
  onPress: () => void;
};

export function BottomActionBar({ label, onPress }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const pressProgress = useSharedValue(0);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressProgress.value, [0, 1], [1, 0.96]) }],
    opacity: interpolate(pressProgress.value, [0, 1], [1, 0.85]),
  }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          pressProgress.value = withTiming(1, { duration: PRESS_IN_DURATION, easing: PRESS_EASING });
        }}
        onPressOut={() => {
          pressProgress.value = withTiming(0, { duration: PRESS_OUT_DURATION, easing: PRESS_EASING });
        }}
      >
        <Animated.View style={[styles.bar, barStyle]}>
          <View style={styles.upArrow}>
            <ChevronDownIcon color="#272024" size={16} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  bar: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: 'rgba(245, 237, 234, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0B0808',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  upArrow: {
    transform: [{ rotate: '180deg' }],
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: '#272024',
  },
});
