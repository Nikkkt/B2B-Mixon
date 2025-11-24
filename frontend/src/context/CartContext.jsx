import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../api/cartApi";
import { fetchProfile, updateProfile } from "../api/profileApi";
import { useNotifications } from "./NotificationContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { warning, error: notifyError } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Готівковий");
  const [orderType, setOrderType] = useState("Поточне");
  const [comment, setComment] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Load cart from backend on mount/user change
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        setItems([]);
        return;
      }

      try {
        setLoading(true);
        const cart = await cartApi.fetchCart();
        console.log("Loaded cart from backend:", cart);
        setItems(cart.items || []);
      } catch (error) {
        console.error("Failed to load cart:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (!user) {
        setCurrentUser(null);
        setProfileError("");
        setIsProfileLoading(false);
        return;
      }

      try {
        setIsProfileLoading(true);
        setProfileError("");
        const profile = await fetchProfile();
        if (isMounted) {
          setCurrentUser(profile);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error?.response?.data?.error || error?.message || "Не вдалося завантажити профіль.";
          setProfileError(message);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Add item to cart (backend + local state)
  const addItem = useCallback(
    async (product, rawQuantity = 1) => {
      if (!user) {
        warning("Будь ласка, увійдіть в систему");
        return;
      }

      const quantity = Number(rawQuantity);
      if (quantity <= 0 || isNaN(quantity)) {
        return;
      }

      try {
        console.log("Adding to cart:", product.id, quantity);
        const updatedCart = await cartApi.addToCart(product.id, quantity);
        setItems(updatedCart.items || []);
      } catch (error) {
        console.error("Failed to add item to cart:", error);
        notifyError("Не вдалося додати товар до кошика");
      }
    },
    [notifyError, user, warning]
  );

  // Remove item from cart (backend + local state)
  const removeItem = useCallback(
    async (cartItemId) => {
      if (!user) return;

      try {
        console.log("Removing cart item:", cartItemId);
        const updatedCart = await cartApi.removeCartItem(cartItemId);
        setItems(updatedCart.items || []);
      } catch (error) {
        console.error("Failed to remove cart item:", error);
        notifyError("Не вдалося видалити товар");
      }
    },
    [notifyError, user]
  );

  // Update item quantity (backend + local state)
  const updateItemQuantity = useCallback(
    async (cartItemId, rawQuantity) => {
      if (!user) return;

      const quantity = Number.parseInt(rawQuantity, 10);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        // If quantity is 0 or less, remove the item
        await removeItem(cartItemId);
        return;
      }

      try {
        console.log("Updating cart item:", cartItemId, quantity);
        const updatedCart = await cartApi.updateCartItem(cartItemId, quantity);
        setItems(updatedCart.items || []);
      } catch (error) {
        console.error("Failed to update cart item:", error);
        notifyError("Не вдалося оновити кількість");
      }
    },
    [notifyError, removeItem, user]
  );

  // Clear cart (backend + local state)
  const clearCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      console.log("Clearing cart");
      await cartApi.clearCart();
      setItems([]);
      setComment("");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      // Clear locally anyway
      setItems([]);
    }
  }, [user]);

  const updateUserProfile = useCallback(
    async (payload) => {
      if (!user) {
        throw new Error("Необхідно увійти, щоб оновити профіль.");
      }

      try {
        setIsProfileLoading(true);
        setProfileError("");
        const updated = await updateProfile(payload);
        setCurrentUser(updated);
        return updated;
      } catch (error) {
        const message =
          error?.response?.data?.error || error?.message || "Не вдалося оновити профіль.";
        setProfileError(message);
        throw new Error(message);
      } finally {
        setIsProfileLoading(false);
      }
    },
    [user]
  );

  // Drawer controls
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  // Calculate totals from items
  const totals = items.reduce(
    (acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const priceWithDiscount = Number(item.priceWithDiscount) || 0;
      const weight = Number(item.weight) || 0;
      const volume = Number(item.volume) || 0;

      acc.totalQuantity += quantity;
      acc.totalOriginalPrice += price * quantity;
      acc.totalDiscountedPrice += priceWithDiscount * quantity;
      acc.totalWeight += weight * quantity;
      acc.totalVolume += volume * quantity;
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

  const value = {
    // Cart items
    items,
    loading,

    // Cart operations
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,

    // Order info
    paymentMethod,
    setPaymentMethod,
    orderType,
    setOrderType,
    comment,
    setComment,

    // Totals
    totalQuantity: totals.totalQuantity,
    totalOriginalPrice: totals.totalOriginalPrice,
    totalDiscountedPrice: totals.totalDiscountedPrice,
    totalWeight: totals.totalWeight,
    totalVolume: totals.totalVolume,

    // Drawer
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,

    // Profile data
    currentUser,
    isProfileLoading,
    profileError,
    updateUserProfile,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
