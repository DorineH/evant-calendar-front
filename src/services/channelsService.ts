import { api } from "./api";

export interface Channel {
  id: string;
  name: string;
  inviteCode: string;
  openTime: string;
  timezone: string;
  startDate: string;
  endDate: string;
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
};
