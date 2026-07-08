import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import {
  Easing,
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { PerformanceOverlay } from "../components/PerformanceOverlay";
import { RandomWalkSquare } from "../components/RandomWalkSquare";

const TOP_COLORS = ["#5E443F", "#904D4E", "#2D2338", "#5E443F"];
const BOTTOM_COLORS = ["#A3837D", "#34272B", "#867677", "#A3837D"];
const SEGMENT_DURATION_MS = 9000;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

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
      <Text style={styles.text}>Hello World, Devansh</Text>
      <RandomWalkSquare />
      <PerformanceOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 24,
    color: "#E5D5D5",
  },
});
