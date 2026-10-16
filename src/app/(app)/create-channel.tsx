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

export default function CreateChannelScreen() {
  const [name, setName] = useState("");
  const [openTime, setOpenTime] = useState("18:00");
  const [startDate, setStartDate] = useState("2026-12-01");
  const [endDate, setEndDate] = useState("2026-12-24");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate() {
    if (!name) {
      Alert.alert("Nom manquant", "Donne un nom à ton canal.");
      return;
    }
    setIsSubmitting(true);
    try {
      const channel = await channelsService.create({
        name,
        openTime,
        startDate,
        endDate,
      });
      Alert.alert(
        "Canal créé !",
        `Partage ce code à tes amis : ${channel.inviteCode}`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Une erreur est survenue";
      Alert.alert("Création impossible", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un canal</Text>

      <Text style={styles.label}>Nom du canal</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Famille"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Heure d'ouverture (HH:mm)</Text>
      <TextInput
        style={styles.input}
        placeholder="18:00"
        value={openTime}
        onChangeText={setOpenTime}
      />

      <Text style={styles.label}>Date de début (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
      />

      <Text style={styles.label}>Date de fin (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? "..." : "Créer"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 24 },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
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
