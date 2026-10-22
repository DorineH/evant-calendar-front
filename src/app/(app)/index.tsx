import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { Channel, channelsService } from "../../services/channelsService";

export default function ChannelsListScreen() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadChannels();
    }, []),
  );

  async function loadChannels() {
    setIsLoading(true);
    try {
      const data = await channelsService.getMyChannels();
      setChannels(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes canaux</Text>
        {user && (
          <TouchableOpacity
            onPress={() => router.push("/(app)/profile")}
            accessibilityLabel="Mon profil"
          >
            <Avatar
              uri={user.avatarUrl}
              pseudo={user.pseudo}
              seed={user.id}
              size={40}
            />
          </TouchableOpacity>
        )}
      </View>

      {!isLoading && channels.length === 0 && (
        <Text style={styles.empty}>
          Tu ne fais partie d'aucun canal pour l'instant.
        </Text>
      )}

      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => router.push(`/(app)/channel/${item.id}`)}
          >
            <Text style={styles.channelName}>{item.name}</Text>
            <Text style={styles.channelInfo}>
              Ouverture à {item.openTime.slice(0, 5)}
            </Text>
          </TouchableOpacity>
        )}
        refreshing={isLoading}
        onRefresh={loadChannels}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(app)/create-channel")}
        >
          <Text style={styles.buttonText}>Créer un canal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={() => router.push("/(app)/join-channel")}
        >
          <Text style={styles.buttonOutlineText}>Rejoindre avec un code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "bold" },
  logout: { color: "#c0392b" },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
  channelCard: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  channelName: { fontSize: 18, fontWeight: "600" },
  channelInfo: { color: "#666", marginTop: 4 },
  actions: { marginTop: 10, gap: 10 },
  button: {
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  buttonOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#c0392b",
  },
  buttonOutlineText: { color: "#c0392b", fontWeight: "bold", fontSize: 16 },
});
