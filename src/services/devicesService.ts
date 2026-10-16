import { api } from "./api";

export const devicesService = {
  async register(expoPushToken: string): Promise<void> {
    await api.post("/devices/register", { expoPushToken });
  },
};
