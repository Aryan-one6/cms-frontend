import axios from "axios";

export const SITE_STORAGE_KEY = "sapphire.activeSiteId";

const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:5050/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // IMPORTANT for cookies
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const siteId = localStorage.getItem(SITE_STORAGE_KEY);
    if (siteId) {
      config.headers = config.headers ?? {};
      config.headers["X-Site-Id"] = siteId;
    }
  }
  return config;
});
