import { File } from "expo-file-system";
import { api } from "./api";

export interface Post {
  id: string;
  photoUrl: string;
  caption?: string;
  dayDate: string;
  user: { id: string; pseudo: string; avatarUrl: string | null };
  isMine: boolean;
  openedByMe: boolean;
}

export interface DayPostsResult {
  locked: boolean;
  unlocksAt: string;
  posts: Post[];
  othersCount: number;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export const postsService = {
  async getUploadSignature(channelId: string): Promise<UploadSignature> {
    const response = await api.post<UploadSignature>(
      `/channels/${channelId}/posts/upload-signature`,
    );
    return response.data;
  },

  async uploadToCloudinary(
    sig: UploadSignature,
    photoUri: string,
  ): Promise<string> {
    const formData = new FormData();
    const file = new File(photoUri);
    formData.append("file", file, "photo.jpg");
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Échec de l'upload");
    }
    return data.secure_url;
  },

  async confirmPost(
    channelId: string,
    photoUrl: string,
    dayDate: string,
    caption?: string,
  ): Promise<Post> {
    const response = await api.post<Post>(`/channels/${channelId}/posts`, {
      photoUrl,
      dayDate,
      caption,
    });
    return response.data;
  },

  async getDayPosts(channelId: string, date: string): Promise<DayPostsResult> {
    const response = await api.get<DayPostsResult>(
      `/channels/${channelId}/posts/days/${date}`,
    );
    return response.data;
  },

  async openPost(channelId: string, postId: string): Promise<void> {
    await api.post(`/channels/${channelId}/posts/${postId}/open`);
  },
};
