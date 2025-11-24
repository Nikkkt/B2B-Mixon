import api from "./client";

export const fetchUserCustomerAccounts = async () => {
  const { data } = await api.get("/user-customers");
  return data;
};
