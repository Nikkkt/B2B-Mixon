import api from "./client";

export const fetchOrderDirections = async () => {
  const { data } = await api.get("/orders/directions");
  return data;
};

export const fetchOrderGroups = async (directionId) => {
  if (!directionId) {
    return [];
  }
  const { data } = await api.get(`/orders/directions/${directionId}/groups`);
  return data;
};

export const fetchOrderProducts = async (groupId) => {
  if (!groupId) {
    return [];
  }
  const { data } = await api.get(`/orders/groups/${groupId}/products`);
  return data.map((product) => ({
    ...product,
    price: Number(product.price ?? 0),
    priceWithDiscount: Number(product.priceWithDiscount ?? product.price ?? 0),
    discountPercent: Number(product.discountPercent ?? 0),
    weight: Number(product.weight ?? 0),
    volume: Number(product.volume ?? 0),
    availability: product.availability ?? null,
  }));
};

export const lookupProductsByCodes = async (items) => {
  const payload = { items };
  const { data } = await api.post("/orders/lookup-by-codes", payload);
  return data;
};
