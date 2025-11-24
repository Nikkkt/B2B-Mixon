import api from "./client";

export const fetchCart = async () => {
  const { data } = await api.get("/cart");
  return data;
};

export const addToCart = async (productId, quantity) => {
  const { data } = await api.post("/cart/items", {
    productId,
    quantity,
  });
  return data;
};

export const updateCartItem = async (cartItemId, quantity) => {
  const { data } = await api.put(`/cart/items/${cartItemId}`, {
    quantity,
  });
  return data;
};

export const removeCartItem = async (cartItemId) => {
  const { data } = await api.delete(`/cart/items/${cartItemId}`);
  return data;
};

export const clearCart = async () => {
  const { data } = await api.delete("/cart");
  return data;
};
