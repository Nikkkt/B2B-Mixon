import api from "./client";

export const register = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const resendVerification = async (email) => {
  const { data } = await api.post("/auth/register/resend-code", { email });
  return data;
};

export const verifyEmail = async (payload) => {
  const { data } = await api.post("/auth/verify-email", payload);
  return data;
};

export const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const requestPasswordReset = async (email) => {
  const { data } = await api.post("/auth/password-reset/request", { email });
  return data;
};

export const verifyPasswordReset = async (payload) => {
  const { data } = await api.post("/auth/password-reset/verify", payload);
  return data;
};

export const resetPassword = async (payload) => {
  const { data } = await api.post("/auth/password-reset/confirm", payload);
  return data;
};
