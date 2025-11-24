import api from "./client";

export const fetchProfile = async () => {
  const { data } = await api.get("/profile");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/profile", payload);
  return data;
};
