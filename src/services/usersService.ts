import { File } from "expo-file-system";
import { api } from "./api";

export interface Me {
  id: string;
  email: string;
  pseudo: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AvatarSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  publicId: string;
}

export const usersService = {
  async updateProfile(data: {
    pseudo?: string;
    avatarUrl?: string | null;
  }): Promise<Me> {
    const response = await api.patch<Me>("/users/me", data);
    return response.data;
  },

  async changeEmail(newEmail: string, currentPassword: string): Promise<Me> {
    const response = await api.patch<Me>("/users/me/email", {
      newEmail,
      currentPassword,
    });
    return response.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await api.patch("/users/me/password", { currentPassword, newPassword });
  },

  async getAvatarSignature(): Promise<AvatarSignature> {
    const response = await api.post<AvatarSignature>(
      "/users/me/avatar-signature",
    );
    return response.data;
  },

  async uploadAvatar(sig: AvatarSignature, photoUri: string): Promise<string> {
    const formData = new FormData();
    const file = new File(photoUri);
    formData.append("file", file, "avatar.jpg");
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("public_id", sig.publicId);
    formData.append("overwrite", "true");
    formData.append("invalidate", "true");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Échec de l'envoi de la photo");
    }
    return data.secure_url;
  },
};
