import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { DayPostsResult, postsService } from "../../../services/postsService";

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ChannelDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [dayData, setDayData] = useState<DayPostsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const today = getTodayISO();

  useFocusEffect(
    useCallback(() => {
      loadDay();
    }, [id]),
  );

  async function loadDay() {
    setIsLoading(true);
    try {
      const data = await postsService.getDayPosts(id, today);
      setDayData(data);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de charger les photos du jour.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "L'accès à la caméra est nécessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      const sig = await postsService.getUploadSignature(id);
      const photoUrl = await postsService.uploadToCloudinary(
        sig,
        result.assets[0].uri,
      );
      await postsService.confirmPost(id, photoUrl, today);
      await loadDay();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Une erreur est survenue";
      Alert.alert("Échec", message);
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const myPost = dayData?.posts.find((p) => p.user.id === user?.id);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Aujourd'hui</Text>

      {dayData?.locked ? (
        <View style={styles.lockedBox}>
          {myPost ? (
            <>
              <Image source={{ uri: myPost.photoUrl }} style={styles.myPhoto} />
              <Text style={styles.lockedText}>
                Photo envoyée ! Les autres apparaîtront à l'ouverture.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.lockedText}>Case encore verrouillée 🔒</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleTakePhoto}
                disabled={isUploading}
              >
                <Text style={styles.buttonText}>
                  {isUploading ? "Envoi..." : "Prendre ma photo du jour"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={dayData?.posts ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.galleryItem}>
              <Image
                source={{ uri: item.photoUrl }}
                style={styles.galleryPhoto}
              />
              <Text style={styles.galleryPseudo}>{item.user.pseudo}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Personne n'a encore posté aujourd'hui.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  back: { color: "#c0392b", marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  lockedBox: { alignItems: "center", marginTop: 40 },
  lockedText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  myPhoto: { width: 200, height: 200, borderRadius: 12, marginBottom: 16 },
  button: {
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  galleryItem: { flex: 1, margin: 6, alignItems: "center" },
  galleryPhoto: { width: "100%", aspectRatio: 1, borderRadius: 10 },
  galleryPseudo: { marginTop: 4, fontSize: 13, color: "#666" },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
});
