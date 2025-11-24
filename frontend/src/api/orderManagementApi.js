import api from "./client";

const buildOrderHistoryParams = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.createdByUserId) {
    params.append("createdByUserId", filters.createdByUserId);
  }
  if (filters.customerAccountId) {
    params.append("customerAccountId", filters.customerAccountId);
  }
  if (filters.startDate) {
    params.append("startDate", filters.startDate);
  }
  if (filters.endDate) {
    params.append("endDate", filters.endDate);
  }
  if (filters.orderType) {
    params.append("orderType", filters.orderType);
  }
  if (filters.paymentMethod) {
    params.append("paymentMethod", filters.paymentMethod);
  }
  if (filters.visibilityScope) {
    params.append("visibilityScope", filters.visibilityScope);
  }
  if (filters.page) {
    params.append("page", filters.page);
  }
  if (filters.pageSize) {
    params.append("pageSize", filters.pageSize);
  }

  return params;
};

export const createOrder = async (orderData) => {
  const { data } = await api.post("/orders", orderData);
  return data;
};

export const fetchOrderHistory = async (filters = {}) => {
  const params = buildOrderHistoryParams(filters);
  const { data } = await api.get(`/orders/history?${params.toString()}`);
  return data;
};

export const exportOrderHistoryExcel = async (filters = {}) => {
  const params = buildOrderHistoryParams(filters);
  const response = await api.get(`/orders/history/export/excel?${params.toString()}`, {
    responseType: "blob",
  });
  return response.data;
};

export const exportOrderHistoryPdf = async (filters = {}) => {
  const params = buildOrderHistoryParams(filters);
  const response = await api.get(`/orders/history/export/pdf?${params.toString()}`, {
    responseType: "blob",
  });
  return response.data;
};

export const fetchOrderById = async (orderId) => {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
};

export const repeatOrder = async (orderId) => {
  const { data } = await api.post(`/orders/${orderId}/repeat`);
  return data;
};

export const fetchAvailableUsers = async () => {
  const { data } = await api.get("/orders/available-users");
  return data;
};
