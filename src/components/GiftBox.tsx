import { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

const RIBBON = "#f1c40f";

type AnimatedViewStyle = ComponentProps<typeof Animated.View>["style"];

interface GiftBoxProps {
  size: number;
  color: string;
  lidStyle?: AnimatedViewStyle;
}

/** Cadeau dessiné avec des View : [nœud + couvercle] animables + boîte */
export function GiftBox({ size, color, lidStyle }: GiftBoxProps) {
  const ribbonWidth = size * 0.13;
  const loop = {
    width: size * 0.24,
    height: size * 0.15,
    borderRadius: size * 0.08,
    borderWidth: ribbonWidth * 0.45,
  };

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Groupe animable : nœud + couvercle */}
      <Animated.View style={[styles.lidGroup, lidStyle]}>
        <View style={[styles.bow, { marginBottom: -size * 0.03 }]}>
          <View
            style={[styles.loop, loop, { transform: [{ rotate: "-25deg" }] }]}
          />
          <View
            style={[styles.loop, loop, { transform: [{ rotate: "25deg" }] }]}
          />
        </View>
        <View
          style={[
            styles.lid,
            {
              width: size * 0.86,
              height: size * 0.2,
              backgroundColor: color,
              borderRadius: size * 0.04,
            },
          ]}
        >
          <View style={[styles.ribbonVertical, { width: ribbonWidth }]} />
        </View>
      </Animated.View>

      {/* Boîte */}
      <View
        style={[
          styles.body,
          {
            width: size * 0.76,
            height: size * 0.52,
            backgroundColor: color,
            borderBottomLeftRadius: size * 0.04,
            borderBottomRightRadius: size * 0.04,
          },
        ]}
      >
        <View style={styles.bodyShade} />
        <View style={[styles.ribbonVertical, { width: ribbonWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: "8%",
  },
  lidGroup: { alignItems: "center", zIndex: 2, elevation: 2 },
  bow: { flexDirection: "row", zIndex: 3 },
  loop: {
    borderColor: RIBBON,
    backgroundColor: "transparent",
    marginHorizontal: -2,
  },
  lid: { alignItems: "center" },
  body: { alignItems: "center", overflow: "hidden" },
  bodyShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  ribbonVertical: { height: "100%", backgroundColor: RIBBON },
});
