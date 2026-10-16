import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { devicesService } from "./devicesService";

export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    console.log(
      "Les notifications push nécessitent un vrai appareil (pas un simulateur).",
    );
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permission de notification refusée.");
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn("projectId EAS introuvable — vérifie app.json");
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const expoPushToken = tokenResponse.data;

  await devicesService.register(expoPushToken);
}
