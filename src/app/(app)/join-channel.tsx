import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { channelsService } from "../../services/channelsService";

export default function JoinChannelScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleJoin() {
    if (inviteCode.length !== 6) {
      Alert.alert("Code invalide", "Le code fait 6 caractères.");
      return;
    }
    setIsSubmitting(true);
    try {
      await channelsService.join(inviteCode.toUpperCase());
      router.back();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Une erreur est survenue";
      Alert.alert("Impossible de rejoindre", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejoindre un canal</Text>
      <Text style={styles.subtitle}>Entre le code reçu de ton ami</Text>

      <TextInput
        style={styles.input}
        placeholder="XXXXXX"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleJoin}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "..." : "Rejoindre"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 8 },
  subtitle: { color: "#666", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 4,
  },
  button: {
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 16, textAlign: "center", color: "#c0392b" },
});
