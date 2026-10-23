import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={6}
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={24}
        color={checked ? "#c0392b" : "#888"}
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginVertical: 6,
  },
  label: { flex: 1, fontSize: 13, color: "#444", lineHeight: 18 },
});
