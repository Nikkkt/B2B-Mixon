import api from "./client";

export const fetchAdminProductGroups = async () => {
  const { data } = await api.get("/admin/product-groups");
  return data;
};

export const createAdminProductGroup = async (payload) => {
  const { data } = await api.post("/admin/product-groups", payload);
  return data;
};

export const updateAdminProductGroup = async (groupId, payload) => {
  const { data } = await api.put(`/admin/product-groups/${groupId}`, payload);
  return data;
};

export const deleteAdminProductGroup = async (groupId) => {
  await api.delete(`/admin/product-groups/${groupId}`);
};

export const uploadProductGroupDiscounts = async (formData) => {
  const { data } = await api.post("/admin/product-groups/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
