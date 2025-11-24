import api from "./client";

export const fetchAvailabilityBranches = async () => {
  const { data } = await api.get("/availability/branches");
  return data ?? [];
};

export const fetchAvailabilityDirections = async (branchId) => {
  if (!branchId) {
    return [];
  }
  const { data } = await api.get("/availability/directions", {
    params: { branchId }
  });
  return data ?? [];
};

export const fetchAllAvailabilityDirections = async () => {
  const { data } = await api.get("/availability/directions");
  return data ?? [];
};

export const fetchAvailabilityGroups = async (directionId) => {
  if (!directionId) {
    return [];
  }
  const { data } = await api.get(`/availability/directions/${directionId}/groups`);
  return data ?? [];
};

export const fetchAvailabilityProducts = async (branchId, groupId) => {
  if (!branchId || !groupId) {
    return null;
  }
  const { data } = await api.get(`/availability/branches/${branchId}/groups/${groupId}/products`);
  return data;
};

export const fetchGroupAvailabilityTable = async (groupId) => {
  if (!groupId) {
    return null;
  }
  const { data } = await api.get(`/availability/groups/${groupId}/table`);
  return data;
};

export const fetchProductAvailabilityByCode = async (code) => {
  const trimmed = code?.trim();
  if (!trimmed) {
    return null;
  }
  const { data } = await api.get("/availability/products/by-code", {
    params: { code: trimmed }
  });
  return data;
};

export const searchProductsByName = async (query) => {
  const trimmed = query?.trim();
  if (!trimmed || trimmed.length < 3) {
    return [];
  }
  const { data } = await api.get("/availability/products/search", {
    params: { query: trimmed }
  });
  return data ?? [];
};

export const uploadAvailabilityFile = async (file) => {
  if (!file) {
    throw new Error("Файл не передано.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/availability/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return data;
};

const downloadGroupAvailability = async (groupId, format) => {
  const url = format === "excel"
    ? `/availability/groups/${groupId}/export/excel`
    : `/availability/groups/${groupId}/export/pdf`;

  const response = await api.get(url, { responseType: "blob" });
  return response;
};

export const downloadGroupAvailabilityExcel = (groupId) => downloadGroupAvailability(groupId, "excel");

export const downloadGroupAvailabilityPdf = (groupId) => downloadGroupAvailability(groupId, "pdf");
