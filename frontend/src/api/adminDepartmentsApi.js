import api from "./client";

export const fetchAdminDepartmentsDashboard = async () => {
  const { data } = await api.get("/admin/departments");
  return data;
};

export const createAdminDepartment = async (payload) => {
  const { data } = await api.post("/admin/departments", payload);
  return data;
};

export const fetchAdminDepartment = async (departmentId) => {
  const { data } = await api.get(`/admin/departments/${departmentId}`);
  return data;
};

export const updateAdminDepartment = async (departmentId, payload) => {
  const { data} = await api.put(`/admin/departments/${departmentId}`, payload);
  return data;
};

export const deleteAdminDepartment = async (departmentId) => {
  const { data } = await api.delete(`/admin/departments/${departmentId}`);
  return data;
};
