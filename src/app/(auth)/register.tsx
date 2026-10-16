import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    if (!email || !password || !pseudo) {
      Alert.alert("Champs manquants", "Remplis tous les champs.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register(email, password, pseudo);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Une erreur est survenue";
      Alert.alert("Inscription impossible", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>

      <TextInput
        style={styles.input}
        placeholder="Pseudo"
        value={pseudo}
        onChangeText={setPseudo}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe (8 caractères min.)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "..." : "S'inscrire"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 16, textAlign: "center", color: "#c0392b" },
});
