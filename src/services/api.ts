import axios from "axios";
import { API_BASE_URL } from "./config";
import { tokenStorage } from "./tokenStorage";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
