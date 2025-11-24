import api from "./client";

export const uploadProducts = async (formData) => {
  const { data } = await api.post("/products/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};
