import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "../../../components/Avatar";
import { useAuth } from "../../../context/AuthContext";
import {
  Channel,
  ChannelMemberView,
  channelsService,
} from "../../../services/channelsService";
import { DayPostsResult, postsService } from "../../../services/postsService";
import { parseApiError } from "../../../utils/apiErrors";
import {
  addDays,
  diffDays,
  formatDayLong,
  todayInTimeZone,
} from "../../../utils/dateTime";

/** Dernier jour consultable : aujourd'hui, ou la date de fin si le calendrier est terminé */
function lastAvailableDay(channel: Channel, today: string): string {
  return today < channel.endDate ? today : channel.endDate;
}

/** Jour affiché à l'ouverture de l'écran */
function defaultDay(channel: Channel): string {
  const today = todayInTimeZone(channel.timezone);
  if (today < channel.startDate) return channel.startDate;
  return lastAvailableDay(channel, today);
}

export default function ChannelDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [members, setMembers] = useState<ChannelMemberView[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayData, setDayData] = useState<DayPostsResult | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const dayRequest = useRef(0);

  useFocusEffect(
    useCallback(() => {
      loadChannel();
      loadMembers();
    }, [id]),
  );

  useEffect(() => {
    if (selectedDate) loadDay(selectedDate);
  }, [selectedDate, channel?.openTime]);

  // ================= CHARGEMENTS =================

  async function loadChannel() {
    try {
      const data = await channelsService.getChannel(id);
      setChannel(data);
      setChannelError(null);

      const today = todayInTimeZone(data.timezone);
      const last = lastAvailableDay(data, today);
      setSelectedDate((prev) =>
        prev && prev >= data.startDate && prev <= last
          ? prev
          : defaultDay(data),
      );
    } catch (error) {
      setChannelError(parseApiError(error).message);
    }
  }

  async function loadMembers() {
    try {
      setMembers(await channelsService.getMembers(id));
    } catch {
      setMembers([]);
    }
  }

  async function loadDay(date: string) {
    const requestId = ++dayRequest.current;
    setDayLoading(true);
    setDayError(null);
    setDayData(null);
    try {
      const data = await postsService.getDayPosts(id, date);
      if (requestId === dayRequest.current) setDayData(data);
    } catch (error) {
      if (requestId === dayRequest.current) {
        setDayError(parseApiError(error).message);
      }
    } finally {
      if (requestId === dayRequest.current) setDayLoading(false);
    }
  }

  function refreshAll() {
    loadChannel();
    loadMembers();
    if (selectedDate) loadDay(selectedDate);
  }

  // ================= ACTIONS =================

  async function handleTakePhoto() {
    if (!channel) return;
    const today = todayInTimeZone(channel.timezone);

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
      setSelectedDate(today);
      await loadDay(today);
    } catch (error) {
      const message =
        error instanceof Error && !("isAxiosError" in error)
          ? error.message
          : parseApiError(error).message;
      Alert.alert("Échec", message);
    } finally {
      setIsUploading(false);
    }
  }

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
      // Menu de partage fermé : rien à faire
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
            } catch (error) {
              Alert.alert(
                "Échec de la suppression",
                parseApiError(error).message,
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  }

  // ================= ÉCRANS D'ATTENTE / ERREUR =================

  if (channelError) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={styles.errorText}>{channelError}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!channel || !selectedDate) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // ================= CALCULS DU JOUR =================

  const today = todayInTimeZone(channel.timezone);
  const notStarted = today < channel.startDate;
  const lastDay = lastAvailableDay(channel, today);
  const isToday = selectedDate === today;
  const canPrev = !notStarted && selectedDate > channel.startDate;
  const canNext = !notStarted && selectedDate < lastDay;
  const totalDays = diffDays(channel.startDate, channel.endDate) + 1;
  const dayNumber = diffDays(channel.startDate, selectedDate) + 1;

  const myPost = dayData?.posts.find((p) => p.user.id === user?.id);
  const todayInRange = today >= channel.startDate && today <= channel.endDate;
  const canPost = isToday && todayInRange && !myPost;
  const showGallery = !!dayData && !dayData.locked && !notStarted;

  // ================= EN-TÊTE =================

  const header = (
    <View>
      {/* Retour + actions du créateur */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>

        {channel.myRole === "owner" && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/edit-channel/[id]", params: { id } })
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

      <Text style={styles.channelName}>
        {channel.name} · ouverture à {channel.openTime}
      </Text>

      {/* Code d'invitation */}
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

      {/* Membres */}
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

      {/* Navigation entre les jours */}
      {!notStarted && (
        <>
          <View style={styles.dayNav}>
            <TouchableOpacity
              onPress={() => setSelectedDate(addDays(selectedDate, -1))}
              disabled={!canPrev}
              hitSlop={12}
              accessibilityLabel="Jour précédent"
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={canPrev ? "#c0392b" : "#ddd"}
              />
            </TouchableOpacity>

            <View style={styles.dayCenter}>
              <Text style={styles.dayTitle}>
                {isToday ? "Aujourd'hui" : formatDayLong(selectedDate)}
              </Text>
              <Text style={styles.daySubtitle}>
                Jour {dayNumber} / {totalDays}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={!canNext}
              hitSlop={12}
              accessibilityLabel="Jour suivant"
            >
              <Ionicons
                name="chevron-forward"
                size={28}
                color={canNext ? "#c0392b" : "#ddd"}
              />
            </TouchableOpacity>
          </View>

          {selectedDate !== lastDay && (
            <TouchableOpacity
              onPress={() => setSelectedDate(lastDay)}
              style={styles.todayLink}
            >
              <Text style={styles.todayLinkText}>
                {lastDay === today
                  ? "Revenir à aujourd'hui"
                  : "Aller au dernier jour"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Contenu du jour */}
      {notStarted ? (
        <View style={styles.lockedBox}>
          <Text style={styles.lockedText}>
            Le calendrier commence le{" "}
            {formatDayLong(channel.startDate).toLowerCase()} 🎄
          </Text>
        </View>
      ) : dayLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : dayError ? (
        <Text style={[styles.errorText, { marginTop: 20 }]}>{dayError}</Text>
      ) : dayData?.locked ? (
        <View style={styles.lockedBox}>
          {myPost ? (
            <>
              <Image source={{ uri: myPost.photoUrl }} style={styles.myPhoto} />
              <Text style={styles.lockedText}>
                Photo envoyée ! Les autres apparaîtront à {channel.openTime}.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.lockedText}>
                Case encore verrouillée 🔒{"\n"}Ouverture à {channel.openTime}
              </Text>
              {canPost && (
                <TouchableOpacity
                  style={[styles.button, isUploading && styles.disabled]}
                  onPress={handleTakePhoto}
                  disabled={isUploading}
                >
                  <Text style={styles.buttonText}>
                    {isUploading ? "Envoi..." : "Prendre ma photo du jour"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : showGallery && canPost ? (
        // Case ouverte mais je n'ai pas encore posté aujourd'hui
        <TouchableOpacity
          style={[
            styles.button,
            styles.lateButton,
            isUploading && styles.disabled,
          ]}
          onPress={handleTakePhoto}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>
            {isUploading ? "Envoi..." : "Poster ma photo du jour"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={showGallery && !dayLoading ? dayData!.posts : []}
      keyExtractor={(item) => item.id}
      numColumns={2}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <View style={styles.galleryItem}>
          <Image source={{ uri: item.photoUrl }} style={styles.galleryPhoto} />
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
        showGallery && !dayLoading ? (
          <Text style={styles.empty}>
            {isToday
              ? "Personne n'a encore posté aujourd'hui."
              : "Personne n'a posté ce jour-là."}
          </Text>
        ) : null
      }
      refreshing={false}
      onRefresh={refreshAll}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  back: { color: "#c0392b" },
  ownerActions: { flexDirection: "row", alignItems: "center", gap: 18 },
  edit: { color: "#c0392b", fontWeight: "600" },
  channelName: { fontSize: 14, color: "#888", marginBottom: 4 },

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

  dayNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 14,
  },
  dayCenter: { alignItems: "center", flex: 1 },
  dayTitle: { fontSize: 22, fontWeight: "bold", color: "#222" },
  daySubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  todayLink: { alignSelf: "center", marginTop: 8 },
  todayLinkText: { color: "#c0392b", fontWeight: "600", fontSize: 13 },

  lockedBox: { alignItems: "center", marginTop: 30 },
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
    alignItems: "center",
  },
  lateButton: { marginTop: 16, marginBottom: 4 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  disabled: { opacity: 0.6 },
  errorText: { color: "#c0392b", textAlign: "center" },

  galleryItem: { width: "50%", padding: 6, alignItems: "center" },
  galleryPhoto: { width: "100%", aspectRatio: 1, borderRadius: 10 },
  galleryAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    maxWidth: "100%",
  },
  galleryPseudo: { fontSize: 13, color: "#666", flexShrink: 1 },
  empty: { textAlign: "center", color: "#888", marginTop: 30 },
});
