// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { useAuth } from "../../context/AuthContext";

// export default function HomeScreen() {
//   const { user, logout } = useAuth();

//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Connecté en tant que {user?.pseudo} 🎄</Text>
//       <TouchableOpacity style={styles.button} onPress={logout}>
//         <Text style={styles.buttonText}>Se déconnecter</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 24,
//   },
//   text: { fontSize: 18, marginBottom: 20 },
//   button: { backgroundColor: "#c0392b", padding: 12, borderRadius: 8 },
//   buttonText: { color: "#fff", fontWeight: "bold" },
// });

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { channelsService, Channel } from "../../services/channelsService";

export default function ChannelsListScreen() {
  const { user, logout } = useAuth();
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
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Déconnexion</Text>
        </TouchableOpacity>
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
