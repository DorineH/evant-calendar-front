import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "../../components/Avatar";
import { FormField } from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { usersService } from "../../services/usersService";
import { parseApiError } from "../../utils/apiErrors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  // --- Avatar ---
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  // --- Pseudo ---
  const [pseudo, setPseudo] = useState(user?.pseudo ?? "");
  const [pseudoError, setPseudoError] = useState<string | undefined>();
  const [pseudoSaving, setPseudoSaving] = useState(false);
  const [pseudoSuccess, setPseudoSuccess] = useState(false);
  // --- Email ---
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailErrors, setEmailErrors] = useState<{
    newEmail?: string;
    currentPassword?: string;
  }>({});
  const [emailGeneral, setEmailGeneral] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  // --- Mot de passe ---
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdErrors, setPwdErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [pwdGeneral, setPwdGeneral] = useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  // --- Newsletter ---
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  if (!user) return null;

  /** Affiche un message de succès pendant 3 secondes */
  function flash(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 3000);
  }

  // ================= AVATAR =================
  function handleAvatarPress() {
    setAvatarError(null);
    const buttons: {
      text: string;
      style?: "destructive";
      onPress: () => void;
    }[] = [
      { text: "Prendre une photo", onPress: () => pickAvatar("camera") },
      { text: "Galerie", onPress: () => pickAvatar("library") },
    ];
    if (user?.avatarUrl) {
      buttons.push({
        text: "Supprimer",
        style: "destructive",
        onPress: removeAvatar,
      });
    }
    Alert.alert("Photo de profil", "Tape à côté pour annuler.", buttons, {
      cancelable: true,
    });
  }

  async function pickAvatar(source: "camera" | "library") {
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setAvatarError(
          "L'accès à la caméra est nécessaire pour prendre une photo.",
        );
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        ...options,
        mediaTypes: ["images"],
      });
    }

    if (result.canceled || !result.assets[0]) return;

    setAvatarBusy(true);
    try {
      const sig = await usersService.getAvatarSignature();
      const url = await usersService.uploadAvatar(sig, result.assets[0].uri);
      const updated = await usersService.updateProfile({ avatarUrl: url });
      updateUser(updated);
    } catch (error) {
      const message =
        error instanceof Error && !("isAxiosError" in error)
          ? error.message
          : parseApiError(error).message;
      setAvatarError(message);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    try {
      const updated = await usersService.updateProfile({ avatarUrl: null });
      updateUser(updated);
    } catch (error) {
      setAvatarError(parseApiError(error).message);
    } finally {
      setAvatarBusy(false);
    }
  }

  // ================= PSEUDO =================
  async function handleSavePseudo() {
    const trimmed = pseudo.trim();
    if (trimmed.length < 2)
      return setPseudoError("Le pseudo doit contenir au moins 2 caractères");
    if (trimmed.length > 30)
      return setPseudoError("Le pseudo ne peut pas dépasser 30 caractères");

    setPseudoSaving(true);
    try {
      const updated = await usersService.updateProfile({ pseudo: trimmed });
      updateUser(updated);
      setPseudo(updated.pseudo);
      flash(setPseudoSuccess);
    } catch (error) {
      const { fieldErrors, message } = parseApiError(error);
      setPseudoError(fieldErrors.pseudo ?? message);
    } finally {
      setPseudoSaving(false);
    }
  }

  // ================= EMAIL =================
  function closeEmailForm() {
    setShowEmailForm(false);
    setNewEmail("");
    setEmailPassword("");
    setEmailErrors({});
    setEmailGeneral(null);
  }

  async function handleSaveEmail() {
    setEmailGeneral(null);
    const errors: typeof emailErrors = {};
    if (!newEmail.trim()) errors.newEmail = "Le nouvel email est obligatoire";
    else if (!EMAIL_REGEX.test(newEmail.trim()))
      errors.newEmail = "L'adresse email n'est pas valide";
    if (!emailPassword)
      errors.currentPassword = "Le mot de passe actuel est obligatoire";
    setEmailErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setEmailSaving(true);
    try {
      const updated = await usersService.changeEmail(
        newEmail.trim(),
        emailPassword,
      );
      updateUser(updated);
      closeEmailForm();
      flash(setEmailSuccess);
    } catch (error) {
      const { fieldErrors, message } = parseApiError(error);
      const mapped = {
        newEmail: fieldErrors.newEmail,
        currentPassword: fieldErrors.currentPassword,
      };
      setEmailErrors(mapped);
      if (!mapped.newEmail && !mapped.currentPassword) setEmailGeneral(message);
    } finally {
      setEmailSaving(false);
    }
  }

  // ================= MOT DE PASSE =================
  function closePwdForm() {
    setShowPwdForm(false);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPwdErrors({});
    setPwdGeneral(null);
  }

  async function handleSavePassword() {
    setPwdGeneral(null);
    const errors: typeof pwdErrors = {};
    if (!currentPwd)
      errors.currentPassword = "Le mot de passe actuel est obligatoire";
    if (newPwd.length < 8)
      errors.newPassword =
        "Le nouveau mot de passe doit contenir au moins 8 caractères";
    if (confirmPwd !== newPwd)
      errors.confirmPassword = "Les deux mots de passe ne correspondent pas";
    setPwdErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwdSaving(true);
    try {
      await usersService.changePassword(currentPwd, newPwd);
      closePwdForm();
      flash(setPwdSuccess);
    } catch (error) {
      const { fieldErrors, message } = parseApiError(error);
      const mapped = {
        currentPassword: fieldErrors.currentPassword,
        newPassword: fieldErrors.newPassword,
      };
      setPwdErrors(mapped);
      if (!mapped.currentPassword && !mapped.newPassword)
        setPwdGeneral(message);
    } finally {
      setPwdSaving(false);
    }
  }

  // ================= DÉCONNEXION =================
  function handleLogout() {
    Alert.alert(
      "Se déconnecter ?",
      "Tu devras te reconnecter pour accéder à tes canaux.",
      [
        { text: "Non", style: "cancel" },
        { text: "Oui, me déconnecter", style: "destructive", onPress: logout },
      ],
    );
  }

  // =========== CONSENTEMENT NEWSLETTER ============
  async function handleToggleConsent(value: boolean) {
    setConsentSaving(true);
    setConsentError(null);
    try {
      const updated = await usersService.updateProfile({
        marketingConsent: value,
      });
      updateUser(updated);
    } catch (error) {
      setConsentError(parseApiError(error).message);
    } finally {
      setConsentSaving(false);
    }
  }

  // ================= AFFICHAGE =================
  const pseudoChanged = pseudo.trim() !== user.pseudo;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mon profil</Text>

        {/* ---------- Avatar ---------- */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} disabled={avatarBusy}>
            <Avatar
              uri={user.avatarUrl}
              pseudo={user.pseudo}
              seed={user.id}
              size={110}
            />
            {avatarBusy && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAvatarPress} disabled={avatarBusy}>
            <Text style={styles.linkText}>
              {user.avatarUrl ? "Changer la photo" : "Ajouter une photo"}
            </Text>
          </TouchableOpacity>
          {avatarError && <Text style={styles.errorText}>{avatarError}</Text>}
        </View>

        {/* ---------- Pseudo ---------- */}
        <View style={styles.section}>
          <FormField
            label="Pseudo"
            placeholder="Visible par les membres de tes canaux"
            value={pseudo}
            onChangeText={(v) => {
              setPseudo(v);
              setPseudoError(undefined);
            }}
            error={pseudoError}
            maxLength={30}
          />
          {pseudoChanged && (
            <TouchableOpacity
              style={[styles.smallButton, pseudoSaving && styles.disabled]}
              onPress={handleSavePseudo}
              disabled={pseudoSaving}
            >
              <Text style={styles.smallButtonText}>
                {pseudoSaving ? "..." : "Enregistrer le pseudo"}
              </Text>
            </TouchableOpacity>
          )}
          {pseudoSuccess && (
            <Text style={styles.successText}>Pseudo mis à jour ✓</Text>
          )}
        </View>

        {/* ---------- Email ---------- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Email</Text>
          <View style={styles.row}>
            <Text style={styles.value}>{user.email}</Text>
            {!showEmailForm && (
              <TouchableOpacity onPress={() => setShowEmailForm(true)}>
                <Text style={styles.linkText}>Modifier</Text>
              </TouchableOpacity>
            )}
          </View>
          {emailSuccess && (
            <Text style={styles.successText}>Email mis à jour ✓</Text>
          )}

          {showEmailForm && (
            <View style={styles.subForm}>
              <FormField
                label="Nouvel email"
                placeholder="ex. nouveau@gmail.com"
                value={newEmail}
                onChangeText={(v) => {
                  setNewEmail(v);
                  setEmailErrors((p) => ({ ...p, newEmail: undefined }));
                }}
                error={emailErrors.newEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <FormField
                label="Mot de passe actuel"
                placeholder="Pour confirmer que c'est bien toi"
                value={emailPassword}
                onChangeText={(v) => {
                  setEmailPassword(v);
                  setEmailErrors((p) => ({ ...p, currentPassword: undefined }));
                }}
                error={emailErrors.currentPassword}
                secureTextEntry
              />
              {emailGeneral && (
                <Text style={styles.errorText}>{emailGeneral}</Text>
              )}
              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={closeEmailForm}
                  disabled={emailSaving}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, emailSaving && styles.disabled]}
                  onPress={handleSaveEmail}
                  disabled={emailSaving}
                >
                  <Text style={styles.smallButtonText}>
                    {emailSaving ? "..." : "Enregistrer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ---------- Mot de passe ---------- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mot de passe</Text>
          <View style={styles.row}>
            <Text style={styles.value}>••••••••</Text>
            {!showPwdForm && (
              <TouchableOpacity onPress={() => setShowPwdForm(true)}>
                <Text style={styles.linkText}>Modifier</Text>
              </TouchableOpacity>
            )}
          </View>
          {pwdSuccess && (
            <Text style={styles.successText}>Mot de passe mis à jour ✓</Text>
          )}

          {showPwdForm && (
            <View style={styles.subForm}>
              <FormField
                label="Mot de passe actuel"
                value={currentPwd}
                onChangeText={(v) => {
                  setCurrentPwd(v);
                  setPwdErrors((p) => ({ ...p, currentPassword: undefined }));
                }}
                error={pwdErrors.currentPassword}
                secureTextEntry
                autoComplete="current-password"
              />
              <FormField
                label="Nouveau mot de passe"
                placeholder="8 caractères minimum"
                value={newPwd}
                onChangeText={(v) => {
                  setNewPwd(v);
                  setPwdErrors((p) => ({ ...p, newPassword: undefined }));
                }}
                error={pwdErrors.newPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <FormField
                label="Confirme le nouveau mot de passe"
                value={confirmPwd}
                onChangeText={(v) => {
                  setConfirmPwd(v);
                  setPwdErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                error={pwdErrors.confirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              {pwdGeneral && <Text style={styles.errorText}>{pwdGeneral}</Text>}
              <View style={styles.formActions}>
                <TouchableOpacity onPress={closePwdForm} disabled={pwdSaving}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, pwdSaving && styles.disabled]}
                  onPress={handleSavePassword}
                  disabled={pwdSaving}
                >
                  <Text style={styles.smallButtonText}>
                    {pwdSaving ? "..." : "Enregistrer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ---------- Newsletter ---------- */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.sectionLabel}>Nouvelles par email</Text>
              <Text style={styles.hint}>
                Nouveautés et retour de l'app l'an prochain. Tu peux changer
                d'avis à tout moment.
              </Text>
            </View>
            <Switch
              value={user.marketingConsent}
              onValueChange={handleToggleConsent}
              disabled={consentSaving}
              trackColor={{ false: "#ccc", true: "#e8a39b" }}
              thumbColor={user.marketingConsent ? "#c0392b" : "#f4f3f4"}
            />
          </View>
          {consentError && <Text style={styles.errorText}>{consentError}</Text>}
        </View>

        {/* ---------- Déconnexion ---------- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
  },
  back: { color: "#c0392b", marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "bold", color: "#222", marginBottom: 20 },

  avatarSection: { alignItems: "center", marginBottom: 24, gap: 10 },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 55,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  section: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  value: { fontSize: 16, color: "#222", flexShrink: 1, marginRight: 12 },
  subForm: { marginTop: 14 },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 20,
    marginTop: 4,
  },

  linkText: { color: "#c0392b", fontWeight: "600" },
  cancelText: { color: "#555" },
  errorText: {
    color: "#c0392b",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  successText: { color: "#27ae60", fontSize: 13, marginTop: 6 },

  smallButton: {
    backgroundColor: "#c0392b",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  smallButtonText: { color: "#fff", fontWeight: "bold" },
  disabled: { opacity: 0.6 },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#c0392b",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 30,
  },
  logoutText: { color: "#c0392b", fontWeight: "bold", fontSize: 16 },

  hint: { fontSize: 12, color: "#888", marginTop: 2 },
});
