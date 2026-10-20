import { api } from "./api";

export type ChannelRole = "owner" | "member";

export interface Channel {
  id: string;
  name: string;
  inviteCode: string;
  openTime: string;
  timezone: string;
  startDate: string;
  endDate: string;
  myRole: ChannelRole;
}

export interface UpdateChannelPayload {
  name?: string;
  openTime?: string;
  startDate?: string;
  endDate?: string;
}

export async function getChannel(id: string): Promise<Channel> {
  const { data } = await api.get<Channel>(`/channels/${id}`);
  return data;
}

export async function updateChannel(
  id: string,
  payload: UpdateChannelPayload,
): Promise<Channel> {
  const { data } = await api.patch<Channel>(`/channels/${id}`, payload);
  return data;
}

export const channelsService = {
  async getMyChannels(): Promise<Channel[]> {
    const response = await api.get<Channel[]>("/channels");
    return response.data;
  },

  async create(data: {
    name: string;
    openTime: string;
    startDate: string;
    endDate: string;
  }): Promise<Channel> {
    const response = await api.post<Channel>("/channels", data);
    return response.data;
  },

  async join(inviteCode: string): Promise<Channel> {
    const response = await api.post<Channel>("/channels/join", { inviteCode });
    return response.data;
  },

  async getChannel(id: string): Promise<Channel> {
    const { data } = await api.get<Channel>(`/channels/${id}`);
    return data;
  },
  async updateChannel(
    id: string,
    payload: UpdateChannelPayload,
  ): Promise<Channel> {
    const { data } = await api.patch<Channel>(`/channels/${id}`, payload);
    return data;
  },

  async deleteChannel(id: string): Promise<void> {
    await api.delete(`/channels/${id}`);
  },
};
