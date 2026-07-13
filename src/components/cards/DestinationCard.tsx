import { Image } from 'expo-image';
import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { Fonts } from '@/constants/fonts';

export type DayHighlight = {
  icon: string;
  label: string;
};

export type DestinationCardProps = {
  imageUrl: string;
  destination: string;
  tripType: string;
  price: string;
  duration: string;
  rating: number;
  highlights: DayHighlight[];
};

const HERO_HEIGHT = 170;
const HIGHLIGHTS_HEIGHT = 108;
const ANIMATION_DURATION = 280;
const ANIMATION_EASING = Easing.inOut(Easing.quad);

// A generic neutral blur used as a low-fidelity preview while each remote
// photo loads, since computing a real per-image blurhash would need an
// offline generation step we don't have for arbitrary URLs.
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

function DestinationCardComponent({
  imageUrl,
  destination,
  tripType,
  price,
  duration,
  rating,
  highlights,
}: DestinationCardProps) {
  const progress = useSharedValue(0);
  const expanded = useSharedValue(false);

  // Runs entirely on the UI thread: the tap, the state flip, and the
  // animation kickoff never hop to the JS thread, so a busy JS thread
  // (e.g. FlashList recycling cells mid-scroll) can't stall the chevron.
  const toggleGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    expanded.value = !expanded.value;
    progress.value = withTiming(expanded.value ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  });

  const detailsStyle = useAnimatedStyle(() => ({
    height: progress.value * HIGHLIGHTS_HEIGHT,
    opacity: progress.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.heroWrapper}>
        <Image
          source={{ uri: imageUrl, width: 800, height: 600 }}
          style={styles.hero}
          contentFit="cover"
          placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
          placeholderContentFit="cover"
          transition={300}
        />
        <View style={styles.tripTypeBadge}>
          <Text style={styles.tripTypeText}>{tripType}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ {rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.infoRow}>
          <View style={styles.textBlock}>
            <Text style={styles.destination}>{destination}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.price}>{price}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.duration}>{duration}</Text>
            </View>
          </View>

          <GestureDetector gesture={toggleGesture}>
            <Animated.View style={styles.detailsToggle}>
              <Text style={styles.detailsToggleText}>Details</Text>
              <Animated.View style={chevronStyle}>
                <ChevronDownIcon color="#E5D5D5" size={16} />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>

        <Animated.View style={[styles.detailsSection, detailsStyle]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsContent}
          >
            {highlights.map((highlight, index) => (
              <View key={`${highlight.label}-${index}`} style={styles.highlightChip}>
                <Text style={styles.highlightIcon}>{highlight.icon}</Text>
                <Text style={styles.highlightLabel}>{highlight.label}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

export const DestinationCard = memo(DestinationCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#272024',
  },
  heroWrapper: {
    width: '100%',
    height: HERO_HEIGHT,
  },
  hero: {
    width: '100%',
    height: HERO_HEIGHT,
  },
  tripTypeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(11,8,8,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tripTypeText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: '#F5EDEA',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(11,8,8,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ratingText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: '#F5EDEA',
  },
  body: {
    padding: 16,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  destination: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: '#E5D5D5',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: '#904D4E',
  },
  metaDot: {
    fontSize: 13,
    color: '#867677',
  },
  duration: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#867677',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  detailsToggleText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#E5D5D5',
  },
  detailsSection: {
    overflow: 'hidden',
  },
  highlightsContent: {
    gap: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  highlightChip: {
    width: 108,
    backgroundColor: '#34272B',
    borderRadius: 16,
    padding: 10,
    gap: 6,
  },
  highlightIcon: {
    fontSize: 18,
  },
  highlightLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: '#C9BDBD',
  },
});
