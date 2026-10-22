import {
  Channel,
  channelsService,
  getChannel,
  ChannelMemberView,
} from "@/services/channelsService";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { DayPostsResult, postsService } from "../../../services/postsService";
import { Avatar } from "@/components/Avatar";

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ChannelDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [dayData, setDayData] = useState<DayPostsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<ChannelMemberView[]>([]);

  const today = getTodayISO();

  useFocusEffect(
    useCallback(() => {
      loadDay();
      loadChannel();
      loadMembers();
    }, [id]),
  );

  async function handleCopyCode() {
    if (!channel) return;
    await Clipboard.setStringAsync(channel.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareCode() {
    if (!channel) return;
    try {
      await Share.share({
        message: `Rejoins mon calendrier de l'avent « ${channel.name} » ! 🎄\nCode d'invitation : ${channel.inviteCode}`,
      });
    } catch {
      // L'utilisateur a fermé le menu de partage : rien à faire
    }
  }

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

  async function loadChannel() {
    try {
      const data = await getChannel(id);
      setChannel(data);
    } catch {
      setChannel(null);
    }
  }

  async function loadMembers() {
    try {
      const data = await channelsService.getMembers(id);
      setMembers(data);
    } catch {
      setMembers([]);
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

  function handleDeleteChannel() {
    Alert.alert(
      "Supprimer le canal ?",
      `« ${channel?.name ?? "Ce canal"} » et toutes ses photos seront supprimés définitivement, pour tous les membres. Cette action est irréversible.`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await channelsService.deleteChannel(id);
              router.replace("/");
            } catch (error: any) {
              const message =
                error?.response?.data?.message ||
                error.message ||
                "Une erreur est survenue";
              Alert.alert("Échec de la suppression", message);
            }
          },
        },
      ],
      { cancelable: true },
    );
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
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>

        {channel?.myRole === "owner" && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "../edit-channel/[id]",
                  params: { id },
                })
              }
              hitSlop={10}
            >
              <Text style={styles.edit}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteChannel}
              hitSlop={10}
              accessibilityLabel="Supprimer le canal"
            >
              <Ionicons name="trash-outline" size={22} color="#c0392b" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {channel && (
        <Text style={styles.channelName}>
          {channel.name} · ouverture à {channel.openTime}
        </Text>
      )}

      {channel && (
        <View style={styles.inviteBox}>
          <View>
            <Text style={styles.inviteLabel}>Code d'invitation</Text>
            <Text style={styles.inviteCode}>{channel.inviteCode}</Text>
          </View>

          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={handleCopyCode}
              accessibilityLabel="Copier le code d'invitation"
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={18}
                color="#c0392b"
              />
              <Text style={styles.inviteButtonText}>
                {copied ? "Copié !" : "Copier"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inviteButton}
              onPress={handleShareCode}
              accessibilityLabel="Partager le code d'invitation"
            >
              <Ionicons name="share-social-outline" size={18} color="#c0392b" />
              <Text style={styles.inviteButtonText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {members.length > 0 && (
        <View style={styles.membersBox}>
          <Text style={styles.membersTitle}>Membres ({members.length})</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membersRow}
          >
            {members.map((m) => (
              <View key={m.user.id} style={styles.member}>
                <Avatar
                  uri={m.user.avatarUrl}
                  pseudo={m.user.pseudo}
                  seed={m.user.id}
                  size={44}
                />
                <Text style={styles.memberPseudo} numberOfLines={1}>
                  {m.user.id === user?.id ? "Moi" : m.user.pseudo}
                </Text>
                {m.role === "owner" && (
                  <Text style={styles.ownerBadge}>Créateur</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

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
              <View style={styles.galleryAuthor}>
                <Avatar
                  uri={item.user.avatarUrl}
                  pseudo={item.user.pseudo}
                  seed={item.user.id}
                  size={22}
                />
                <Text style={styles.galleryPseudo} numberOfLines={1}>
                  {item.user.pseudo}
                </Text>
              </View>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  back: { color: "#c0392b" },
  edit: { color: "#c0392b", fontWeight: "600" },
  channelName: { fontSize: 14, color: "#888", marginBottom: 4 },
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
  membersBox: { marginBottom: 16 },
  membersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  membersRow: { gap: 14, paddingRight: 8 },
  member: { alignItems: "center", width: 60 },
  memberPseudo: { fontSize: 12, color: "#444", marginTop: 4, maxWidth: 60 },
  ownerBadge: { fontSize: 10, color: "#c0392b", fontWeight: "600" },

  galleryAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    maxWidth: "100%",
  },
  galleryPseudo: { fontSize: 13, color: "#666", flexShrink: 1 },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
  ownerActions: { flexDirection: "row", alignItems: "center", gap: 18 },
  inviteBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fdf2f0",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  inviteLabel: { fontSize: 12, color: "#888" },
  inviteCode: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 3,
    color: "#333",
  },
  inviteActions: { flexDirection: "row", gap: 8 },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#c0392b",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  inviteButtonText: { color: "#c0392b", fontWeight: "600", fontSize: 13 },
});
