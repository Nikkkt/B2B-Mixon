import api from "./client";

export const fetchAdminDirections = async () => {
  const { data } = await api.get("/admin/directions");
  return data;
};

export const createAdminDirection = async (payload) => {
  const { data } = await api.post("/admin/directions", payload);
  return data;
};

export const updateAdminDirection = async (directionId, payload) => {
  const { data } = await api.put(`/admin/directions/${directionId}`, payload);
  return data;
};

export const deleteAdminDirection = async (directionId) => {
  await api.delete(`/admin/directions/${directionId}`);
};
