import { Ionicons } from "@expo/vector-icons";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { channelsService } from "../../services/channelsService";
import {
  dateToIso,
  dateToTime,
  defaultAdventDates,
  formatFr,
  isoToDate,
  timeToDate,
  todayIso,
} from "../../utils/dateTime";

export default function CreateChannelScreen() {
  const defaults = defaultAdventDates();

  const [name, setName] = useState("");
  const [openTime, setOpenTime] = useState("18:00");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function pickTime() {
    DateTimePickerAndroid.open({
      value: timeToDate(openTime),
      mode: "time",
      is24Hour: true,
      onValueChange: (_event, date) => {
        if (date) setOpenTime(dateToTime(date));
      },
    });
  }

  function pickStartDate() {
    DateTimePickerAndroid.open({
      value: isoToDate(startDate),
      mode: "date",
      minimumDate: isoToDate(todayIso()),
      maximumDate: isoToDate(endDate),
      onValueChange: (_event, date) => {
        if (date) setStartDate(dateToIso(date));
      },
    });
  }

  function pickEndDate() {
    DateTimePickerAndroid.open({
      value: isoToDate(endDate),
      mode: "date",
      minimumDate: isoToDate(startDate),
      onValueChange: (_event, date) => {
        if (date) setEndDate(dateToIso(date));
      },
    });
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Nom manquant", "Donne un nom à ton canal.");
      return;
    }
    if (startDate > endDate) {
      Alert.alert(
        "Dates invalides",
        "La date de début doit être avant la date de fin.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const channel = await channelsService.create({
        name: trimmedName,
        openTime,
        startDate,
        endDate,
      });
      Alert.alert(
        "Canal créé !",
        `Partage ce code à tes amis : ${channel.inviteCode}\n\nTu le retrouveras à tout moment dans l'écran du canal.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      const raw = error?.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join("\n")
        : raw || "Une erreur est survenue";
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
        placeholder="Ex : Famille"
        value={name}
        onChangeText={setName}
        maxLength={50}
      />

      <Text style={styles.label}>Heure d'ouverture</Text>
      <Pressable style={styles.pickerField} onPress={pickTime}>
        <Text style={styles.pickerText}>{openTime}</Text>
        <Ionicons name="time-outline" size={20} color="#c0392b" />
      </Pressable>

      <Text style={styles.label}>Date de début</Text>
      <Pressable style={styles.pickerField} onPress={pickStartDate}>
        <Text style={styles.pickerText}>{formatFr(startDate)}</Text>
        <Ionicons name="calendar-outline" size={20} color="#c0392b" />
      </Pressable>

      <Text style={styles.label}>Date de fin</Text>
      <Pressable style={styles.pickerField} onPress={pickEndDate}>
        <Text style={styles.pickerText}>{formatFr(endDate)}</Text>
        <Ionicons name="calendar-outline" size={20} color="#c0392b" />
      </Pressable>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? "..." : "Créer"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
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
  pickerField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  pickerText: { fontSize: 16, color: "#333" },
  button: {
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 16, textAlign: "center", color: "#c0392b" },
});
