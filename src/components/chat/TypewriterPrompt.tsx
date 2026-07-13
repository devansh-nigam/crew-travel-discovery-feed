import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Fonts } from '@/constants/fonts';

const PROMPTS = [
  'Ask me anything about planning your trip.',
  'Find a 3-day itinerary for Kyoto.',
  'What should I pack for a beach weekend?',
  'Suggest a family-friendly trip to Spain.',
  'Help me plan a budget-friendly Europe trip.',
];

const TYPE_SPEED_MS = 45;
const DELETE_SPEED_MS = 25;
const HOLD_DURATION_MS = 1400;
const PAUSE_BEFORE_NEXT_MS = 400;

function BlinkingCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
    );
  }, [opacity]);

  const cursorStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.Text style={[styles.text, styles.cursor, cursorStyle]}>|</Animated.Text>;
}

export function TypewriterPrompt() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'deleting'>('typing');

  useEffect(() => {
    const currentPrompt = PROMPTS[promptIndex];

    if (phase === 'typing') {
      if (displayedText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
        }, TYPE_SPEED_MS);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => setPhase('deleting'), HOLD_DURATION_MS);
      return () => clearTimeout(timeout);
    }

    if (displayedText.length > 0) {
      const timeout = setTimeout(() => {
        setDisplayedText(currentPrompt.slice(0, displayedText.length - 1));
      }, DELETE_SPEED_MS);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      setPromptIndex((current) => (current + 1) % PROMPTS.length);
      setPhase('typing');
    }, PAUSE_BEFORE_NEXT_MS);
    return () => clearTimeout(timeout);
  }, [phase, displayedText, promptIndex]);

  return (
    <View style={styles.row}>
      <Text style={styles.text}>{displayedText}</Text>
      <BlinkingCursor />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#867677',
    textAlign: 'center',
  },
  cursor: {
    color: '#904D4E',
  },
});
