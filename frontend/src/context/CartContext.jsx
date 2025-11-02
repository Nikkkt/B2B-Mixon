import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const DEFAULT_PROFILE_FIELDS = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  companyCode: "",
  country: "",
  city: "",
  address: "",
  fax: "",
  language: "ukrainian",
  password: "",
  avatarUrl: "",
};

const createUser = (userKey, overrides = {}) => {
  const merged = { ...DEFAULT_PROFILE_FIELDS, userKey, ...overrides };

  const inferredFirstName = merged.firstName || (merged.name ? merged.name.split(/\s+/)[0] : "");
  const inferredLastName = merged.lastName || (merged.name ? merged.name.split(/\s+/).slice(1).join(" ") : "");
  const displayName = merged.name || [inferredFirstName, inferredLastName].filter(Boolean).join(" ").trim();

  return {
    ...merged,
    firstName: inferredFirstName,
    lastName: inferredLastName,
    name: displayName,
    language: merged.language || DEFAULT_PROFILE_FIELDS.language,
  };
};

const normalizeUser = (user, fallbackKey = user?.userKey ?? "") => {
  const safeKey = user?.userKey ?? fallbackKey;
  if (!safeKey) {
    return createUser("custom", user);
  }
  return createUser(safeKey, user);
};

const findUserKeyById = (usersMap, userId) => {
  return (
    Object.entries(usersMap).find(([, user]) => user.id === userId)?.[0] ?? null
  );
};

const restoreUsers = (rawUsers) => {
  if (!rawUsers) {
    return DEFAULT_USERS;
  }
  return Object.fromEntries(
    Object.entries(rawUsers).map(([key, value]) => [key, createUser(key, value)])
  );
};

const CartContext = createContext(null);

const STORAGE_KEY = "mixon_cart_state_v1";

const DEFAULT_USERS = {
  customer: createUser("customer", {
    id: "customer-1",
    role: "user",
    managerId: "manager-1",
    firstName: "Андрій",
    lastName: "Василенко",
    email: "andrii.vasylenko@mixon.ua",
    phone: "+380 67 123 4567",
    company: "ТОВ Міксон",
    companyCode: "11111111",
    country: "Україна",
    city: "Одеса",
    address: "вул. Промислова, 12",
    fax: "+380 48 765 4321",
    password: "",
  }),
  manager: createUser("manager", {
    id: "manager-1",
    role: "manager",
    managedCustomerIds: ["customer-1", "customer-2"],
    firstName: "Іван",
    lastName: "Керівник",
    email: "ivan.kerivnyk@mixon.ua",
    phone: "+380 50 111 2233",
    company: "Mixon",
    country: "Україна",
    city: "Київ",
    address: "вул. Ділова, 7",
  }),
  manager2: createUser("manager2", {
    id: "manager-2",
    role: "manager",
    managedCustomerIds: ["customer-3"],
    firstName: "Олег",
    lastName: "Менеджер",
    email: "oleh.menedzher@mixon.ua",
    phone: "+380 63 987 6543",
    company: "Mixon",
    country: "Україна",
    city: "Харків",
    address: "просп. Героїв, 21",
  }),
  admin: createUser("admin", {
    id: "admin-1",
    role: "admin",
    firstName: "Наталія",
    lastName: "Адміністратор",
    email: "admin@mixon.ua",
    phone: "+380 44 555 6677",
    company: "Mixon",
    country: "Україна",
    city: "Одеса",
    address: "вул. Центральна, 1",
  }),
};

const DEFAULT_CUSTOMERS = [
  { id: "customer-1", name: "Василенко Андрій", managerId: "manager-1" },
  { id: "customer-2", name: "108 - 108 Магазин на Раскідайловській Одеса", managerId: "manager-1" },
  { id: "customer-3", name: "6 - 6 Склад філіал Харків", managerId: "manager-2" },
];

const getDefaultActiveCustomerId = (user) => {
  if (!user) {
    return null;
  }
  if (user.role === "user") {
    return user.id;
  }
  if (user.role === "manager") {
    return user.managedCustomerIds?.[0] ?? null;
  }
  return null;
};

const findCustomerById = (customers, id) => customers.find((customer) => customer.id === id) ?? null;

const orderMatchesUser = (order, user) => {
  if (!user) {
    return false;
  }
  if (user.role === "admin") {
    return true;
  }
  if (user.role === "manager") {
    const managedIds = new Set(user.managedCustomerIds ?? []);
    return (
      order.createdBy === user.id ||
      (order.customer && (managedIds.has(order.customer.id) || order.customer.managerId === user.id))
    );
  }
  return order.customer?.id === user.id || order.createdBy === user.id;
};

const computeOrderCustomer = (currentUser, customers, activeCustomerId) => {
  if (currentUser.role === "user") {
    return {
      id: currentUser.id,
      name: currentUser.name,
      managerId: currentUser.managerId ?? null,
    };
  }
  if (currentUser.role === "manager") {
    const fallback = currentUser.managedCustomerIds?.[0] ?? null;
    const customer = findCustomerById(customers, activeCustomerId ?? fallback);
    if (customer) {
      return { ...customer };
    }
    return {
      id: currentUser.id,
      name: currentUser.name,
      managerId: currentUser.id,
    };
  }
  // admin
  const customer = findCustomerById(customers, activeCustomerId);
  if (customer) {
    return { ...customer };
  }
  return {
    id: currentUser.id,
    name: currentUser.name,
    managerId: null,
  };
};

const DEFAULT_ORDER_HISTORY = [
  {
    id: "9340",
    createdAt: new Date("2025-10-30T14:41:00Z").toISOString(),
    paymentMethod: "Наличный",
    orderType: "Текущий",
    comment: "",
    customer: { id: "customer-1", name: "Василенко Андрій", managerId: "manager-1" },
    createdBy: "customer-1",
    items: [
      { id: 4073, code: "701-01-1", name: "Деревозахисний грунт NOVOTEX BASE 1л", price: 300, priceWithDiscount: 300, discount: 0, weight: 1.035, volume: 3, quantity: 4 },
    ],
    totals: {
      quantity: 4,
      originalPrice: 1200,
      discountedPrice: 1200,
      weight: 4.14,
      volume: 12,
    },
  },
  {
    id: "9339",
    createdAt: new Date("2025-10-30T12:52:00Z").toISOString(),
    paymentMethod: "Безналичный",
    orderType: "Відстрочений",
    comment: "Доставка після 12:00",
    customer: { id: "customer-2", name: "Магазин на Раскідайловській Одеса", managerId: "manager-1" },
    createdBy: "manager-1",
    items: [
      { id: 5001, code: "108-108", name: "Комплект емаль Mixon Pro 5л", price: 950, priceWithDiscount: 900, discount: 5, weight: 5.4, volume: 4.2, quantity: 6 },
      { id: 5002, code: "500-001", name: "Знежирювач Mixon 1л", price: 180, priceWithDiscount: 180, discount: 0, weight: 1.05, volume: 1, quantity: 3 },
    ],
    totals: {
      quantity: 9,
      originalPrice: 6090,
      discountedPrice: 5580,
      weight: 35.55,
      volume: 28.2,
    },
  },
  {
    id: "9338",
    createdAt: new Date("2025-10-30T10:30:00Z").toISOString(),
    paymentMethod: "Наличный",
    orderType: "Текущий",
    comment: "",
    customer: { id: "customer-3", name: "6 - 6 Склад філіал Харків", managerId: "manager-2" },
    createdBy: "manager-2",
    items: [
      { id: 6001, code: "300-200", name: "Шпаклівка MIXON-UNI 2кг", price: 320, priceWithDiscount: 320, discount: 0, weight: 2.2, volume: 3, quantity: 14 },
    ],
    totals: {
      quantity: 14,
      originalPrice: 4480,
      discountedPrice: 4480,
      weight: 30.8,
      volume: 42,
    },
  },
];

const parsePersistedState = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Unable to parse cart state from storage", error);
    return null;
  }
};

const toNumber = (value) => {
  const numeric = parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeProduct = (product) => ({
  id: product.id,
  code: product.code,
  name: product.name,
  price: toNumber(product.price ?? product.priceWithDiscount ?? 0),
  priceWithDiscount: toNumber(product.priceWithDiscount ?? product.price ?? 0),
  discount: product.discount ?? 0,
  weight: toNumber(product.weight),
  volume: toNumber(product.volume),
  availability: product.availability ?? "",
});

export function CartProvider({ children }) {
  const persisted = parsePersistedState();
  const initialUsers = restoreUsers(persisted?.users);
  const initialCurrentUser = persisted?.currentUser
    ? normalizeUser(
        persisted.currentUser,
        findUserKeyById(initialUsers, persisted.currentUser?.id) ?? persisted.currentUser?.userKey
      )
    : initialUsers.customer;

  const [items, setItems] = useState(() => persisted?.items ?? []);
  const [paymentMethod, setPaymentMethod] = useState(() => persisted?.paymentMethod ?? "Наличный");
  const [orderType, setOrderType] = useState(() => persisted?.orderType ?? "Текущий");
  const [comment, setComment] = useState(() => persisted?.comment ?? "");
  const [users, setUsers] = useState(initialUsers);
  const [customers] = useState(DEFAULT_CUSTOMERS);
  const [currentUser, setCurrentUserState] = useState(initialCurrentUser);
  const [activeCustomerId, setActiveCustomerId] = useState(() => {
    if (persisted?.activeCustomerId) {
      return persisted.activeCustomerId;
    }
    return getDefaultActiveCustomerId(initialCurrentUser);
  });
  const [orderHistory, setOrderHistory] = useState(() => {
    if (persisted?.orderHistory?.length) {
      return persisted.orderHistory;
    }
    return DEFAULT_ORDER_HISTORY;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const payload = {
      items,
      paymentMethod,
      orderType,
      comment,
      orderHistory,
      users,
      currentUser,
      customers,
      activeCustomerId,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Unable to persist cart state", error);
    }
  }, [items, paymentMethod, orderType, comment, orderHistory, users, currentUser, customers, activeCustomerId]);

  const addItem = useCallback((product, rawQuantity = 1) => {
    const quantity = toNumber(rawQuantity);
    if (quantity <= 0) {
      return;
    }

    setItems((prev) => {
      const normalized = normalizeProduct(product);
      const existingIndex = prev.findIndex((item) => item.id === normalized.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          quantity: existing.quantity + quantity,
        };
        return next;
      }
      return [...prev, { ...normalized, quantity }];
    });
  }, []);

  const updateItemQuantity = useCallback((productId, rawQuantity) => {
    setItems((prev) => {
      const quantity = toNumber(rawQuantity);
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== productId);
      }
      return prev.map((item) =>
        item.id === productId
          ? { ...item, quantity }
          : item
      );
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const quantity = toNumber(item.quantity);
        acc.totalQuantity += quantity;
        acc.totalOriginalPrice += item.price * quantity;
        acc.totalDiscountedPrice += item.priceWithDiscount * quantity;
        acc.totalWeight += item.weight * quantity;
        acc.totalVolume += item.volume * quantity;
        return acc;
      },
      {
        totalQuantity: 0,
        totalOriginalPrice: 0,
        totalDiscountedPrice: 0,
        totalWeight: 0,
        totalVolume: 0,
      }
    );
  }, [items]);

  const submitOrder = useCallback(() => {
    if (!items.length) {
      return null;
    }

    const customer = computeOrderCustomer(currentUser, customers, activeCustomerId);

    const orderPayload = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: items.map((item) => ({ ...item })),
      totals: {
        quantity: totals.totalQuantity,
        originalPrice: totals.totalOriginalPrice,
        discountedPrice: totals.totalDiscountedPrice,
        weight: totals.totalWeight,
        volume: totals.totalVolume,
      },
      paymentMethod,
      orderType,
      comment,
      customer,
      createdBy: currentUser.id,
    };

    setOrderHistory((prev) => [orderPayload, ...prev]);
    setItems([]);
    setComment("");
    setPaymentMethod("Наличный");
    setOrderType("Текущий");
    setIsDrawerOpen(false);

    return orderPayload;
  }, [items, totals, paymentMethod, orderType, comment, currentUser, customers, activeCustomerId]);

  const setCurrentUser = useCallback((nextUser) => {
    if (!nextUser) {
      return;
    }

    setUsers((prevUsers) => {
      if (typeof nextUser === "string") {
        const candidate = prevUsers[nextUser];
        if (candidate) {
          setCurrentUserState(candidate);
        }
        return prevUsers;
      }

      const fallbackKey = nextUser.userKey ?? findUserKeyById(prevUsers, nextUser.id) ?? "custom";
      const normalized = normalizeUser(nextUser, fallbackKey);
      setCurrentUserState(normalized);
      return {
        ...prevUsers,
        [fallbackKey]: normalized,
      };
    });
  }, []);

  const updateUserProfile = useCallback(
    (updates) => {
      setUsers((prevUsers) => {
        const userKey = findUserKeyById(prevUsers, currentUser.id) ?? currentUser.userKey ?? "custom";
        const baseUser = prevUsers[userKey] ?? currentUser;
        const nextUser = normalizeUser({ ...baseUser, ...updates }, userKey);
        setCurrentUserState(nextUser);
        return {
          ...prevUsers,
          [userKey]: nextUser,
        };
      });
    },
    [currentUser]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      totalQuantity: totals.totalQuantity,
      totalOriginalPrice: totals.totalOriginalPrice,
      totalDiscountedPrice: totals.totalDiscountedPrice,
      totalWeight: totals.totalWeight,
      totalVolume: totals.totalVolume,
      paymentMethod,
      setPaymentMethod,
      orderType,
      setOrderType,
      comment,
      setComment,
      orderHistory,
      submitOrder,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      currentUser,
      setCurrentUser,
      updateUserProfile,
      users,
      customers,
      activeCustomerId,
      setActiveCustomerId,
      orderMatchesUser,
      computeOrderCustomer,
    }),
    [
      items,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      totals.totalQuantity,
      totals.totalOriginalPrice,
      totals.totalDiscountedPrice,
      totals.totalWeight,
      totals.totalVolume,
      paymentMethod,
      orderType,
      comment,
      orderHistory,
      submitOrder,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      currentUser,
      users,
      customers,
      activeCustomerId,
      setCurrentUser,
      updateUserProfile,
      setActiveCustomerId,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
