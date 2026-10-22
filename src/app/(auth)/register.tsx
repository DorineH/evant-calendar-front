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

type Field = "pseudo" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
  pseudo: string,
  email: string,
  password: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!pseudo.trim()) errors.pseudo = "Le pseudo est obligatoire";
  else if (pseudo.trim().length < 2)
    errors.pseudo = "Le pseudo doit contenir au moins 2 caractères";
  else if (pseudo.trim().length > 30)
    errors.pseudo = "Le pseudo ne peut pas dépasser 30 caractères";

  if (!email.trim()) errors.email = "L'email est obligatoire";
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "L'adresse email n'est pas valide";

  if (!password) errors.password = "Le mot de passe est obligatoire";
  else if (password.length < 8)
    errors.password = "Le mot de passe doit contenir au moins 8 caractères";

  return errors;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function onChange(field: Field, value: string) {
    if (field === "pseudo") setPseudo(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setGeneralError(null);
  }

  async function handleRegister() {
    setGeneralError(null);

    const localErrors = validate(pseudo, email, password);
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register(email.trim(), password, pseudo.trim());
    } catch (error) {
      const { fieldErrors: serverErrors, message } = parseApiError(error);

      const mapped: FieldErrors = {};
      (["pseudo", "email", "password"] as Field[]).forEach((f) => {
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
        <Text style={styles.title}>Inscription</Text>

        <FormField
          label="Pseudo"
          placeholder="ex. FlashMcQueen (visible par les membres)"
          value={pseudo}
          onChangeText={(v) => onChange("pseudo", v)}
          error={fieldErrors.pseudo}
          maxLength={30}
        />

        <FormField
          label="Email"
          placeholder="ex. toto@gmail.com"
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
          placeholder="8 caractères minimum"
          value={password}
          onChangeText={(v) => onChange("password", v)}
          error={fieldErrors.password}
          secureTextEntry
          autoComplete="new-password"
        />

        {generalError && (
          <Text style={styles.generalError}>{generalError}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
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
