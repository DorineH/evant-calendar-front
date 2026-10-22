import { Image, StyleSheet, Text, View } from "react-native";

const COLORS = [
  "#c0392b",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#d35400",
  "#16a085",
  "#2c3e50",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

interface AvatarProps {
  uri?: string | null;
  pseudo: string;
  seed: string;
  size?: number;
}

export function Avatar({ uri, pseudo, seed, size = 40 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimension]} />;
  }

  return (
    <View
      style={[
        styles.placeholder,
        dimension,
        { backgroundColor: colorFor(seed) },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>
        {pseudo.trim().charAt(0).toUpperCase() || "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: "#eee" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  initial: { color: "#fff", fontWeight: "bold" },
});
