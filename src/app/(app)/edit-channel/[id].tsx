import { Ionicons } from "@expo/vector-icons";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Channel,
  UpdateChannelPayload,
  channelsService,
  updateChannel,
} from "../../../services/channelsService";
import {
  dateToIso,
  dateToTime,
  formatFr,
  isoToDate,
  timeToDate,
} from "../../../utils/dateTime";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join("\n");
    if (typeof msg === "string") return msg;
  }
  return "Une erreur est survenue";
}

export default function EditChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [name, setName] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    channelsService
      .getChannel(id)
      .then((c) => {
        if (c.myRole !== "owner") {
          Alert.alert(
            "Accès refusé",
            "Seul le créateur du canal peut le modifier.",
          );
          router.back();
          return;
        }
        setChannel(c);
        setName(c.name);
        setOpenTime(c.openTime);
        setStartDate(c.startDate);
        setEndDate(c.endDate);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  function pickTime() {
    DateTimePickerAndroid.open({
      value: timeToDate(openTime || "19:00"),
      mode: "time",
      is24Hour: true,
      onChange: (event, date) => {
        if (event.type === "set" && date) setOpenTime(dateToTime(date));
      },
    });
  }

  function pickStartDate() {
    DateTimePickerAndroid.open({
      value: isoToDate(startDate),
      mode: "date",
      maximumDate: endDate ? isoToDate(endDate) : undefined,
      onChange: (event, date) => {
        if (event.type === "set" && date) setStartDate(dateToIso(date));
      },
    });
  }

  function pickEndDate() {
    DateTimePickerAndroid.open({
      value: isoToDate(endDate),
      mode: "date",
      minimumDate: startDate ? isoToDate(startDate) : undefined,
      onChange: (event, date) => {
        if (event.type === "set" && date) setEndDate(dateToIso(date));
      },
    });
  }

  const handleSave = async () => {
    if (!channel) return;
    setError(null);

    if (!name.trim()) return setError("Le nom ne peut pas être vide");
    if (!TIME_REGEX.test(openTime))
      return setError("L'heure doit être au format HH:mm (ex. 18:00)");
    if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
      return setError("Les dates doivent être au format AAAA-MM-JJ");
    }
    if (startDate > endDate)
      return setError("La date de début doit être avant la date de fin");

    const payload: UpdateChannelPayload = {};
    if (name.trim() !== channel.name) payload.name = name.trim();
    if (openTime !== channel.openTime) payload.openTime = openTime;
    if (startDate !== channel.startDate) payload.startDate = startDate;
    if (endDate !== channel.endDate) payload.endDate = endDate;

    if (Object.keys(payload).length === 0) {
      router.back();
      return;
    }

    setSaving(true);
    try {
      await updateChannel(id, payload);
      router.back();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Modifier le canal</Text>

        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        <Text style={styles.label}>Heure d'ouverture</Text>
        <Pressable style={styles.pickerField} onPress={pickTime}>
          <Text style={styles.pickerText}>{openTime}</Text>
          <Ionicons name="time-outline" size={20} color="#c0392b" />
        </Pressable>
        <Text style={styles.hint}>
          Le changement s'applique immédiatement, y compris pour la case du
          jour.
        </Text>

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

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enregistrer</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancel}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, gap: 6 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: { fontSize: 16, color: "#333" },
  hint: { fontSize: 12, color: "#777" },
  error: { color: "#c0392b", marginTop: 12 },
  button: {
    backgroundColor: "#c0392b",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancel: { alignItems: "center", paddingVertical: 12 },
  cancelText: { color: "#555" },
});
