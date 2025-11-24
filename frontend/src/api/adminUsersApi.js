import api from "./client";

export const fetchAdminUsersDashboard = async () => {
  const { data } = await api.get("/admin/users");
  return data;
};

export const fetchAdminUser = async (userId) => {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data;
};

export const updateAdminUser = async (userId, payload) => {
  const { data } = await api.put(`/admin/users/${userId}`, payload);
  return data;
};

export const createAdminUser = async (payload) => {
  const { data } = await api.post("/admin/users", payload);
  return data;
};

export const deleteAdminUser = async (userId) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};
