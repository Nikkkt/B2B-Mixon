import axios from "axios";
import { AUTH_STORAGE_KEY } from "../context/AuthContext.jsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5249/api",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch (error) {
      console.warn("Failed to parse auth storage", error);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Сталася помилка. Спробуйте ще раз.";
    return Promise.reject(new Error(message));
  }
);

export default api;
