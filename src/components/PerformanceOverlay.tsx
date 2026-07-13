import { Canvas, Circle, matchFont, Text as SkiaText } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// A frame is considered "dropped" once its render time exceeds the budget
// for 45 FPS (~22.22ms/frame) rather than the device's native refresh rate.
const DROP_FRAME_TIME_MS = 1000 / 45;

// Frame-time histogram used to derive p50/p95 without sorting a growing
// array of samples every frame. 1ms buckets, last bucket is an overflow.
const HISTOGRAM_BUCKET_MS = 1;
const HISTOGRAM_BUCKETS = 250;
const PERCENTILE_RECALC_INTERVAL_FRAMES = 30;

// The JS thread announces itself via this shared value on its own cadence.
// The UI thread never reads a JS-thread clock directly (the two runtimes
// don't share one) -- it only checks whether the tick counter has changed
// since the last frame, using the UI thread's own frame-time deltas to
// measure how long it's been stale.
const JS_HEARTBEAT_INTERVAL_MS = 50;
const JS_BUSY_THRESHOLD_MS = 200;

const BUSY_COLOR = '#E5484D';
const IDLE_COLOR = '#3DD68C';

// Skia's matchFont defaults to fontFamily "System", an iOS-only pseudo-name.
// Android's font manager can't resolve it and silently falls back to a
// typeface with no glyphs, so the text draws with zero visible width.
const FONT_FAMILY = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });

function formatMs(value: number) {
  'worklet';
  return `${value.toFixed(1)}ms`;
}

// Badge (collapsed) layout, in local canvas coordinates.
const BADGE_WIDTH = 112;
const BADGE_HEIGHT = 32;
const BADGE_TEXT_X = 14;
const BADGE_TEXT_Y = 21;
const BADGE_DOT_CX = BADGE_WIDTH - 14;
const BADGE_DOT_CY = BADGE_HEIGHT / 2;

// Expanded panel layout.
const PANEL_WIDTH = 250;
const PANEL_TEXT_HEIGHT = 96;
const PANEL_PADDING = 12;
const ROW_HEIGHT = 22;
const DOT_R = 4;
const DOT_TEXT_GAP = 14;
const PANEL_GAP = 8;
// Rough estimate used until the panel's real height is measured on its first
// layout, so the very first expand doesn't pick the wrong grow direction.
const PANEL_HEIGHT_ESTIMATE = 170;

export function PerformanceOverlay() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);

  const font13 = useMemo(() => matchFont({ fontFamily: FONT_FAMILY, fontSize: 13 }), []);
  const font11 = useMemo(() => matchFont({ fontFamily: FONT_FAMILY, fontSize: 11 }), []);

  // --- UI-thread render measurements ---
  const liveFps = useSharedValue(0);
  const frameDropCount = useSharedValue(0);
  const worstFrameMs = useSharedValue(0);
  const p50Ms = useSharedValue(0);
  const p95Ms = useSharedValue(0);

  // Internal accumulators, never rendered directly.
  const fpsWindowCount = useSharedValue(0);
  const fpsWindowStart = useSharedValue(0);
  const histogram = useSharedValue<number[]>(new Array(HISTOGRAM_BUCKETS).fill(0));
  const totalSamples = useSharedValue(0);
  const framesSincePercentileCalc = useSharedValue(0);

  // --- JS-thread liveness ---
  const jsHeartbeatTick = useSharedValue(0);
  const lastSeenHeartbeatTick = useSharedValue(0);
  const elapsedSinceHeartbeatMs = useSharedValue(0);
  const jsBusy = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => {
      jsHeartbeatTick.value += 1;
    }, JS_HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [jsHeartbeatTick]);

  useFrameCallback((frameInfo) => {
    'worklet';
    const delta = frameInfo.timeSincePreviousFrame;
    if (delta == null) {
      return;
    }

    // Windowed FPS: frames actually rendered per rolling wall-clock second,
    // rather than a spiky instantaneous 1000/delta.
    if (fpsWindowStart.value === 0) {
      fpsWindowStart.value = frameInfo.timestamp;
    }
    fpsWindowCount.value += 1;
    const windowElapsed = frameInfo.timestamp - fpsWindowStart.value;
    if (windowElapsed >= 1000) {
      liveFps.value = Math.round((fpsWindowCount.value * 1000) / windowElapsed);
      fpsWindowCount.value = 0;
      fpsWindowStart.value = frameInfo.timestamp;
    }

    if (delta > DROP_FRAME_TIME_MS) {
      frameDropCount.value += 1;
    }
    if (delta > worstFrameMs.value) {
      worstFrameMs.value = delta;
    }

    const bucketIndex = Math.min(Math.floor(delta / HISTOGRAM_BUCKET_MS), HISTOGRAM_BUCKETS - 1);
    histogram.value[bucketIndex] += 1;
    totalSamples.value += 1;

    framesSincePercentileCalc.value += 1;
    if (framesSincePercentileCalc.value >= PERCENTILE_RECALC_INTERVAL_FRAMES) {
      framesSincePercentileCalc.value = 0;
      const total = totalSamples.value;
      if (total > 0) {
        const p50Target = total * 0.5;
        const p95Target = total * 0.95;
        let running = 0;
        let foundP50 = false;
        for (let i = 0; i < HISTOGRAM_BUCKETS; i++) {
          running += histogram.value[i];
          if (!foundP50 && running >= p50Target) {
            p50Ms.value = i * HISTOGRAM_BUCKET_MS;
            foundP50 = true;
          }
          if (running >= p95Target) {
            p95Ms.value = i * HISTOGRAM_BUCKET_MS;
            break;
          }
        }
      }
    }

    // JS-busy detection: compare the heartbeat tick to what we last saw. If
    // it hasn't moved, accumulate this frame's own duration as "time since
    // JS last checked in" -- all measured on the UI thread's clock.
    if (jsHeartbeatTick.value !== lastSeenHeartbeatTick.value) {
      lastSeenHeartbeatTick.value = jsHeartbeatTick.value;
      elapsedSinceHeartbeatMs.value = 0;
    } else {
      elapsedSinceHeartbeatMs.value += delta;
    }
    jsBusy.value = elapsedSinceHeartbeatMs.value > JS_BUSY_THRESHOLD_MS ? 1 : 0;
  });

  const resetSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    frameDropCount.value = 0;
    worstFrameMs.value = 0;
    p50Ms.value = 0;
    p95Ms.value = 0;
    totalSamples.value = 0;
    histogram.value = new Array(HISTOGRAM_BUCKETS).fill(0);
  };

  const toggleExpanded = () => {
    Haptics.selectionAsync();
    setExpanded((v) => !v);
  };

  const fpsText = useDerivedValue(() => `${liveFps.value} FPS`);
  const dropsText = useDerivedValue(() => `Drops: ${frameDropCount.value}`);
  const jsStatusText = useDerivedValue(() => (jsBusy.value ? 'JS: BUSY' : 'JS: idle'));
  const summaryText = useDerivedValue(
    () => `p50 ${formatMs(p50Ms.value)} p95 ${formatMs(p95Ms.value)} max ${formatMs(worstFrameMs.value)}`,
  );
  const dotColor = useDerivedValue(() => (jsBusy.value ? BUSY_COLOR : IDLE_COLOR));

  // --- Dragging ---
  // The overlay is anchored at (anchorLeft, anchorTop) -- its initial
  // top-right position, sized for the collapsed badge -- and dragging just
  // adds a translateX/translateY on top, entirely on the UI thread.
  const anchorLeft = useMemo(
    () => screenWidth - insets.right - 8 - BADGE_WIDTH,
    [screenWidth, insets.right],
  );
  const anchorTop = useMemo(() => insets.top + 8, [insets.top]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  // The panel is positioned absolutely (see panelPositionStyle below) rather
  // than laid out in-flow after the badge, so dragging is always clamped
  // against the badge's own fixed size -- expanding the panel never changes
  // what's being dragged, and so never displaces the badge from wherever it
  // was left.
  const panelHeight = useSharedValue(PANEL_HEIGHT_ESTIMATE);

  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
  };

  // Drag bounds are expressed as absolute-position bounds (respecting safe
  // area insets on every edge, so the overlay can never be dragged into the
  // status bar or the home-indicator area -- Android's edge-swipe gestures
  // live there and would steal touches from the overlay), then converted to
  // translateX/Y bounds by subtracting the anchor.
  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartX.value = translateX.value;
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = clamp(
        dragStartX.value + e.translationX,
        insets.left - anchorLeft,
        screenWidth - insets.right - BADGE_WIDTH - anchorLeft,
      );
      translateY.value = clamp(
        dragStartY.value + e.translationY,
        insets.top - anchorTop,
        screenHeight - insets.bottom - BADGE_HEIGHT - anchorTop,
      );
    });

  // Gesture.Pan() requires a minimum amount of movement before it activates,
  // so it never fires onEnd for a genuine zero-movement tap -- distance-based
  // tap detection on the pan gesture alone doesn't work. A real Tap gesture
  // has its own (short-distance, short-duration) recognition criteria, so it
  // activates for taps that Pan never even starts for. Race lets whichever
  // one actually recognizes first win, and cancels the other.
  const tapToggleGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(toggleExpanded);
  });

  const dragGesture = Gesture.Race(panGesture, tapToggleGesture);

  const resetTapGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(resetSession);
  });

  const dragAreaStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  // Position the panel relative to the badge's live (possibly mid-drag)
  // position -- never the other way around, so the badge itself never has
  // to move to make room.
  //
  // Horizontally, the panel is simply clamped to stay on screen: it's wide
  // enough relative to typical screen widths that a binary "flip to the
  // other side" choice can fail on both sides at once for a badge sitting
  // mid-screen (assuming the flipped side always fits isn't safe), so it
  // defaults to aligning with the badge's left edge and slides left only as
  // far as needed to stay within the screen.
  //
  // Vertically, the panel must not overlap the badge, so it's a binary
  // choice: grow down by default, flip to grow up only when there's more
  // room than growing down (this direction realistically always fits, since
  // the panel is far shorter than it is wide relative to screen size).
  //
  // The panel is always anchored at left:0/top:0 (see styles.panel) and both
  // of these are expressed purely as a transform offset, never by switching
  // which of left/right or top/bottom is set: toggling which edge keys are
  // present across frames lets a stale left/top from a previous frame linger
  // alongside a new right/bottom, and position:absolute with both edges of
  // an axis set stretches the view to fill between them.
  const panelPositionStyle = useAnimatedStyle(() => {
    const badgeLeft = anchorLeft + translateX.value;
    const badgeTop = anchorTop + translateY.value;

    const clampedPanelLeft = clamp(badgeLeft, insets.left, screenWidth - insets.right - PANEL_WIDTH);
    const offsetX = clampedPanelLeft - badgeLeft;

    const growUp = badgeTop + BADGE_HEIGHT + PANEL_GAP + panelHeight.value > screenHeight - insets.bottom;
    const offsetY = growUp ? -(panelHeight.value + PANEL_GAP) : BADGE_HEIGHT + PANEL_GAP;

    return {
      transform: [{ translateX: offsetX }, { translateY: offsetY }],
    };
  });

  const handlePanelLayout = (e: LayoutChangeEvent) => {
    panelHeight.value = e.nativeEvent.layout.height;
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={[styles.dragArea, { left: anchorLeft, top: anchorTop }, dragAreaStyle]}>
          <View style={styles.badge}>
            <Canvas style={{ width: BADGE_WIDTH, height: BADGE_HEIGHT }}>
              <SkiaText font={font13} text={fpsText} x={BADGE_TEXT_X} y={BADGE_TEXT_Y} color="white" />
              <Circle cx={BADGE_DOT_CX} cy={BADGE_DOT_CY} r={DOT_R} color={dotColor} />
            </Canvas>
          </View>
          {expanded && (
            <Animated.View onLayout={handlePanelLayout} style={[styles.panel, panelPositionStyle]}>
              <View style={{ width: PANEL_WIDTH - PANEL_PADDING * 2, height: PANEL_TEXT_HEIGHT }}>
                <Canvas style={StyleSheet.absoluteFill}>
                  <SkiaText font={font13} text={fpsText} x={0} y={ROW_HEIGHT * 1 - 6} color="white" />
                  <SkiaText font={font13} text={dropsText} x={0} y={ROW_HEIGHT * 2 - 6} color="white" />
                  <Circle cx={DOT_R} cy={ROW_HEIGHT * 3 - 6 - 4} r={DOT_R} color={dotColor} />
                  <SkiaText
                    font={font13}
                    text={jsStatusText}
                    x={DOT_TEXT_GAP}
                    y={ROW_HEIGHT * 3 - 6}
                    color="white"
                  />
                  <SkiaText
                    font={font11}
                    text={summaryText}
                    x={0}
                    y={ROW_HEIGHT * 4 - 6}
                    color="#C9C9C9"
                  />
                </Canvas>
              </View>
              <GestureDetector gesture={resetTapGesture}>
                <View style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </View>
              </GestureDetector>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  dragArea: {
    position: 'absolute',
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: PANEL_PADDING,
    width: PANEL_WIDTH,
  },
  resetButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
});
