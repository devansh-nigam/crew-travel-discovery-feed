import { FlashList } from "@shopify/flash-list";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Easing,
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BAR_HEIGHT, BottomActionBar } from "../components/BottomActionBar";
import { DestinationCard } from "../components/cards/DestinationCard";
import { HeroCoverCard } from "../components/cards/HeroCoverCard";
import { PerformanceOverlay } from "../components/PerformanceOverlay";
import { PlanTripSheet } from "../components/PlanTripSheet";
import { buildDestinationFeed } from "../data/destinationFeed";

const HERO_CARDS = [
  {
    id: "travel",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    title: "Travel",
    subtitle: "Bucket list 2026",
  },
  {
    id: "mountains",
    imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    title: "Escape",
    subtitle: "Mountain trails",
  },
  {
    id: "dining",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    title: "Dining",
    subtitle: "Top picks nearby",
  },
  {
    id: "brunch",
    imageUrl: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&q=80",
    title: "Brunch",
    subtitle: "Weekend favorites",
  },
];

const DESTINATION_FEED = buildDestinationFeed(120);

function renderDestinationItem({ item }: { item: (typeof DESTINATION_FEED)[number] }) {
  return <DestinationCard {...item} />;
}

const TOP_COLORS = ["#5E443F", "#904D4E", "#2D2338", "#5E443F"];
const BOTTOM_COLORS = ["#A3837D", "#34272B", "#867677", "#A3837D"];
const SEGMENT_DURATION_MS = 9000;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(TOP_COLORS.length - 1, {
        duration: SEGMENT_DURATION_MS * (TOP_COLORS.length - 1),
        easing: Easing.linear,
      }),
      -1,
    );
  }, [progress]);

  const inputRange = TOP_COLORS.map((_, index) => index);

  const gradientColors = useDerivedValue(() => [
    interpolateColor(progress.value, inputRange, TOP_COLORS),
    interpolateColor(progress.value, inputRange, BOTTOM_COLORS),
  ]);

  const toggleSheet = () => setIsSheetOpen((current) => !current);

  return (
    <View style={styles.container}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={gradientColors}
          />
        </Rect>
      </Canvas>
      <FlashList
        data={DESTINATION_FEED}
        keyExtractor={(item) => item.id}
        renderItem={renderDestinationItem}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          <View style={styles.heroCarousel}>
            <FlashList
              data={HERO_CARDS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <HeroCoverCard
                  imageUrl={item.imageUrl}
                  title={item.title}
                  subtitle={item.subtitle}
                  style={styles.heroCard}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.heroSeparator} />}
              contentContainerStyle={styles.heroCarouselContent}
            />
          </View>
        }
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + BAR_HEIGHT + 48,
        }}
      />
      <BottomActionBar
        label={isSheetOpen ? "Close" : "Plan a trip"}
        onPress={toggleSheet}
      />
      <PlanTripSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)} containerHeight={height} />
      <PerformanceOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroCarousel: {
    height: 300,
    marginHorizontal: -20,
  },
  heroCarouselContent: {
    paddingHorizontal: 20,
  },
  heroCard: {
    width: 200,
  },
  heroSeparator: {
    width: 12,
  },
  listHeader: {
    marginBottom: 24,
  },
  itemSeparator: {
    height: 12,
  },
});
