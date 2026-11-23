import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const COLORS = [
  "#c0392b",
  "#f1c40f",
  "#27ae60",
  "#2980b9",
  "#e67e22",
  "#8e44ad",
];
const COUNT = 18;
const DURATION = 1200;

interface PieceProps {
  angle: number;
  distance: number;
  color: string;
  spin: number;
  width: number;
}

function ConfettiPiece({ angle, distance, color, spin, width }: PieceProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: 1 - p * p,
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        { translateY: Math.sin(angle) * distance * p + 40 * p * p },
        { rotate: `${spin * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { width, height: width * 0.5, backgroundColor: color },
        style,
      ]}
    />
  );
}

interface ConfettiProps {
  size: number;
  onDone: () => void;
}

export function Confetti({ size, onDone }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        angle: (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.5,
        distance: size * (0.45 + Math.random() * 0.4),
        color: COLORS[i % COLORS.length],
        spin: (Math.random() - 0.5) * 720,
        width: 6 + Math.random() * 4,
      })),
    [size],
  );

  useEffect(() => {
    const timer = setTimeout(onDone, DURATION + 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }]}
    >
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
  },
  piece: { position: "absolute", borderRadius: 1 },
});
