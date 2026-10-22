import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { FormField } from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { parseApiError } from "../../utils/apiErrors";

type Field = "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "L'email est obligatoire";
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "L'adresse email n'est pas valide";
  if (!password) errors.password = "Le mot de passe est obligatoire";
  return errors;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function onChange(field: Field, value: string) {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setGeneralError(null);
  }

  async function handleLogin() {
    setGeneralError(null);

    const localErrors = validate(email, password);
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      const { fieldErrors: serverErrors, message } = parseApiError(error);

      const mapped: FieldErrors = {};
      (["email", "password"] as Field[]).forEach((f) => {
        if (serverErrors[f]) mapped[f] = serverErrors[f];
      });
      setFieldErrors(mapped);

      if (Object.keys(mapped).length === 0) setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
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
        <Text style={styles.title}>Connexion</Text>

        <FormField
          label="Email"
          placeholder="ex. captainamerica@gmail.com"
          value={email}
          onChangeText={(v) => onChange("email", v)}
          error={fieldErrors.email}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
        />

        <FormField
          label="Mot de passe"
          placeholder="Ton mot de passe"
          value={password}
          onChangeText={(v) => onChange("password", v)}
          error={fieldErrors.password}
          secureTextEntry
          autoComplete="current-password"
        />

        {generalError && (
          <Text style={styles.generalError}>{generalError}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "..." : "Se connecter"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>Pas encore de compte ? S'inscrire</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#222",
  },
  generalError: {
    color: "#c0392b",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 16, textAlign: "center", color: "#c0392b" },
});
