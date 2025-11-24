import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiXCircle } from "react-icons/fi";
import { HiOutlineXMark } from "react-icons/hi2";

const NotificationContext = createContext(null);

const TYPE_STYLES = {
  success: {
    accent: "border-green-500",
    icon: <FiCheckCircle className="text-green-500" size={20} />,
  },
  error: {
    accent: "border-red-500",
    icon: <FiXCircle className="text-red-500" size={20} />,
  },
  warning: {
    accent: "border-amber-500",
    icon: <FiAlertTriangle className="text-amber-500" size={20} />,
  },
  info: {
    accent: "border-blue-500",
    icon: <FiInfo className="text-blue-500" size={20} />,
  },
};

const DEFAULT_TITLES = {
  success: "Успішно",
  error: "Помилка",
  warning: "Увага",
  info: "Інформація",
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback(
    ({ type = "info", title, message = "", duration = 4500 }) => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

      setNotifications((prev) => [
        ...prev,
        {
          id,
          type,
          title: title ?? DEFAULT_TITLES[type] ?? DEFAULT_TITLES.info,
          message,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message, options = {}) =>
      showNotification({
        ...options,
        type: "success",
        message,
      }),
    [showNotification]
  );

  const error = useCallback(
    (message, options = {}) =>
      showNotification({
        ...options,
        type: "error",
        message,
      }),
    [showNotification]
  );

  const warning = useCallback(
    (message, options = {}) =>
      showNotification({
        ...options,
        type: "warning",
        message,
      }),
    [showNotification]
  );

  const info = useCallback(
    (message, options = {}) =>
      showNotification({
        ...options,
        type: "info",
        message,
      }),
    [showNotification]
  );

  const value = useMemo(
    () => ({ notify: showNotification, success, error, warning, info, dismiss }),
    [dismiss, error, info, showNotification, success, warning]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-3 px-4 py-6 sm:px-6">
        <div className="mt-auto flex w-full flex-col items-end gap-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border-l-4 bg-white p-4 shadow-2xl ${
                TYPE_STYLES[notification.type]?.accent ?? TYPE_STYLES.info.accent
              }`}
            >
              <div className="rounded-full bg-slate-100 p-2">
                {TYPE_STYLES[notification.type]?.icon ?? TYPE_STYLES.info.icon}
              </div>
              <div className="flex-1 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{notification.title}</p>
                {notification.message && <p className="mt-0.5 text-gray-600">{notification.message}</p>}
              </div>
              <button
                type="button"
                aria-label="Закрити"
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                onClick={() => dismiss(notification.id)}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
