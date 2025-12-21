import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaRedoAlt, FaFilePdf, FaFileExcel, FaSpinner, FaUser } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext.jsx";
import {
  fetchOrderHistory,
  repeatOrder,
  fetchAvailableUsers,
  exportOrderExcel,
  exportOrderPdf,
} from "../api/orderManagementApi";

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return value;
  }
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const normalizeRoleValue = (roleValue) => {
  if (!roleValue) {
    return "user";
  }

  if (typeof roleValue === "string") {
    return roleValue.toLowerCase();
  }

  if (typeof roleValue === "number") {
    switch (roleValue) {
      case 2:
        return "admin";
      case 1:
        return "manager";
      case 3:
        return "department";
      default:
        return "user";
    }
  }

  if (typeof roleValue === "object" && "name" in roleValue) {
    return normalizeRoleValue(roleValue.name);
  }

  return "user";
};

const resolveUserRole = (user) => {
  if (!user) {
    return "user";
  }

  if (Array.isArray(user.roles) && user.roles.length) {
    if (user.roles.includes(2)) {
      return "admin";
    }
    if (user.roles.includes(1)) {
      return "manager";
    }
    if (user.roles.includes(3)) {
      return "department";
    }
  }

  return normalizeRoleValue(user.role);
};

export default function OrderHistory() {
  const { user } = useAuth();
  const { reloadCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedRole = useMemo(() => resolveUserRole(user), [user]);
  const isAdmin = normalizedRole === "admin";
  const isManager = normalizedRole === "manager";

  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [page, setPage] = useState(1);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const scopeOptions = useMemo(() => {
    if (isAdmin) {
      return [
        { value: "my", label: "Мої" },
        { value: "managed", label: "Підлеглих" },
        { value: "my-and-managed", label: "Мої + підлеглих" },
        { value: "all", label: "Усі" },
      ];
    }

    if (isManager) {
      return [
        { value: "my", label: "Мої" },
        { value: "managed", label: "Підлеглих" },
        { value: "my-and-managed", label: "Мої + підлеглих" },
      ];
    }

    return [{ value: "my", label: "Мої" }];
  }, [isAdmin, isManager]);
  const [visibilityScope, setVisibilityScope] = useState(scopeOptions[0]?.value ?? "my");
  const [userSearch, setUserSearch] = useState("");

  const handleExportOrder = async (order, type) => {
    if (!order?.id) {
      return;
    }

    try {
      const blobData = type === "pdf" ? await exportOrderPdf(order.id) : await exportOrderExcel(order.id);
      const safeOrderNumber = (order.orderNumber || "order").replace(/[^a-zA-Z0-9-_]+/g, "-");
      const filename = `${safeOrderNumber}.${type === "pdf" ? "pdf" : "xlsx"}`;
      triggerFileDownload(blobData, filename);
    } catch (error) {
      console.error(`Failed to export order ${type}:`, error);
      alert(`Не вдалося сформувати файл замовлення: ${error.message}`);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) {
      return availableUsers;
    }

    const term = userSearch.trim().toLowerCase();
    return availableUsers.filter((candidate) => {
      const haystack = [
        candidate.fullName,
        candidate.email,
        candidate.firstName,
        candidate.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [availableUsers, userSearch]);

  const newOrderId = location.state?.newOrderId;

  // Fetch available users
  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return;

      try {
        const users = await fetchAvailableUsers();
        console.log("Fetched available users:", users);
        setAvailableUsers(users || []);
      } catch (err) {
        console.error("Failed to fetch available users:", err);
        setAvailableUsers([]);
      }
    };

    loadUsers();
  }, [user]);

  // Fetch orders from backend
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        console.log("Fetching orders with filter:", { createdByUserId: selectedUserId, visibilityScope, page, pageSize });
        const response = await fetchOrderHistory({
          createdByUserId: selectedUserId,
          visibilityScope,
          page,
          pageSize,
        });
        console.log("Fetched orders response:", response);
        setOrders(response.orders || []);
        setTotalCount(response.totalCount || 0);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError("Не вдалося завантажити історію замовлень. Будь ласка, спробуйте пізніше.");
        setOrders([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, selectedUserId, visibilityScope, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleRepeatOrder = async (order) => {
    try {
      await repeatOrder(order.id);
    } catch (err) {
      console.error("Failed to repeat order:", err);
      const message = err?.message || "Не вдалося повторити замовлення. Будь ласка, спробуйте пізніше.";
      alert(message);
      return;
    }

    try {
      await reloadCart();
    } catch (err) {
      console.error("Repeat order succeeded, but cart reload failed:", err);
    }

    navigate("/cart");
  };

  const triggerFileDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId || null);
    setPage(1);
    setIsUserDropdownOpen(false);
  };

  const handleScopeChange = (value) => {
    if (value === visibilityScope) {
      return;
    }
    setVisibilityScope(value);
    setSelectedUserId(null);
    setPage(1);
  };

  useEffect(() => {
    if (!scopeOptions.some((option) => option.value === visibilityScope)) {
      setVisibilityScope(scopeOptions[0]?.value ?? "my");
    }
  }, [scopeOptions, visibilityScope]);

  // Get user's role (normalized by AuthContext)
  // Get selected user display name
  const selectedUserDisplay = () => {
    if (!selectedUserId) {
      return "Усі (за обраним діапазоном)";
    }
    const selectedUser = availableUsers.find((u) => u.id === selectedUserId);
    return selectedUser ? selectedUser.fullName : "Виберіть користувача";
  };

  if (!user) {
    return (
      <HomeLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Будь ласка, увійдіть в систему</div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <a href="/home" className="text-blue-600 hover:underline">
                Головна
              </a>
            </li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center">
              <span className="text-gray-700">Історія замовлень</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Історія замовлень
          </h2>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            {totalCount} замовлень
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Переглядайте, експортуйте та повторюйте замовлення клієнтів у одному сучасному вікні.
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex flex-col gap-4 min-w-[240px] flex-1">
            <div className="text-sm text-gray-700 font-medium">Діапазон замовлень:</div>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((option) => {
                const isActive = option.value === visibilityScope;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleScopeChange(option.value)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm transition min-w-[120px] ${
                      isActive
                        ? "border-blue-300 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    <span className="font-semibold">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {availableUsers.length > 1 && (
            <div className="flex flex-col gap-2 min-w-[260px]">
              <div className="text-sm text-gray-700 font-medium flex items-center gap-2">
                <FaUser className="text-blue-600" />
                <span>Фільтр за користувачем:</span>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(event) => {
                    setUserSearch(event.target.value);
                    setIsUserDropdownOpen(true);
                  }}
                  placeholder="Пошук користувача..."
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-100 min-w-[220px]"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                    className="flex min-w-[230px] items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <span>{selectedUserDisplay()}</span>
                    <span className={`transition-transform ml-2 ${isUserDropdownOpen ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </button>
                  {isUserDropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full min-w-[250px] rounded-xl border border-gray-100 bg-white shadow-xl max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => handleUserSelect(null)}
                        className={`block w-full px-4 py-3 text-left text-sm border-b border-gray-100 ${
                          !selectedUserId
                            ? "bg-blue-50 text-blue-800 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Усі (за обраним діапазоном)
                        <span className="block text-xs text-gray-400 mt-1">
                          Показати замовлення відповідно до обраного діапазону
                        </span>
                      </button>
                      {filteredUsers.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400">Нічого не знайдено</div>
                      )}
                      {filteredUsers.map((availableUser) => {
                        const isActive = selectedUserId === availableUser.id;
                        return (
                          <button
                            key={availableUser.id}
                            type="button"
                            onClick={() => handleUserSelect(availableUser.id)}
                            className={`block w-full px-4 py-3 text-left text-sm border-b border-gray-100 ${
                              isActive
                                ? "bg-blue-50 text-blue-800 font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {availableUser.fullName}
                            <span className="block text-xs text-gray-400 mt-1">
                              {availableUser.email}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {newOrderId && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm text-emerald-800 shadow-inner">
            Нове замовлення <span className="font-semibold">#{newOrderId}</span> успішно відправлено.
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
            <p className="text-gray-500">Завантаження замовлень...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-10 text-red-600 max-w-lg">
              <p className="text-lg font-semibold mb-2">Помилка завантаження</p>
              <p className="text-sm">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Спробувати знову
              </button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-gray-500 max-w-lg">
              <p className="text-lg font-semibold mb-2">Немає замовлень</p>
              <p className="text-sm">
                Поки що не знайдено жодного замовлення. Створіть своє перше замовлення!
              </p>
              <button
                type="button"
                onClick={() => navigate("/orders")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Перейти до каталогу
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-gray-500 mb-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-gray-700">
                Сторінка {page} із {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <span>Показувати:</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} на стор.
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl border border-gray-100 bg-white shadow">
              <table className="w-full text-sm text-gray-800 min-w-[70rem]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                  <tr className="text-left font-semibold">
                    <th className="border-b border-r border-gray-100 px-4 py-3 text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      № Замовлення
                    </th>
                    <th className="border-b border-r border-gray-100 px-4 py-3 text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      Клієнт
                    </th>
                    <th className="border-b border-r border-gray-100 px-4 py-3 text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      К-сть, од.
                    </th>
                    <th className="border-b border-r border-gray-100 px-4 py-3 text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      Вага, кг
                    </th>
                    <th className="border-b border-r border-gray-100 px-4 py-3 text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      Обʼєм, м³
                    </th>
                    <th className="border-b border-r border-gray-100 px-4 py-3 text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      Вартість, грн
                    </th>
                    <th className="border-b border-r border-gray-100 px-4 py-3 text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      Дата
                    </th>
                    <th className="border-b border-gray-100 px-4 py-3 text-center text-[11px] tracking-[0.08em] text-gray-500 uppercase">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/80"
                      } border-b border-gray-100 transition hover:bg-blue-50/60`}
                    >
                      <td className="border-r border-gray-100 px-4 py-3 font-semibold text-blue-600 align-top">
                        {order.orderNumber}
                      </td>
                      <td className="border-r border-gray-100 px-4 py-3 align-top">
                        <div className="text-gray-900 font-medium">
                          {order.customer?.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Створено: {order.createdBy?.fullName || "—"}
                        </div>
                      </td>
                      <td className="border-r border-gray-100 px-4 py-3 align-top text-right font-semibold text-gray-800">
                        {order.totals.totalQuantity.toFixed(2)}
                      </td>
                      <td className="border-r border-gray-100 px-4 py-3 align-top text-right text-gray-700">
                        {order.totals.totalWeight.toFixed(3)}
                      </td>
                      <td className="border-r border-gray-100 px-4 py-3 align-top text-right text-gray-700">
                        {order.totals.totalVolume.toFixed(3)}
                      </td>
                      <td className="border-r border-gray-100 px-4 py-3 align-top">
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          <span className="h-2 w-2 rounded-full bg-blue-300"></span>
                          {order.totals.totalDiscountedPrice.toFixed(2)}
                        </span>
                      </td>
                      <td className="border-r border-gray-100 px-4 py-3 align-top text-sm text-gray-600">
                        <div>{formatDate(order.createdAt)}</div>
                        <div className="text-xs text-gray-500">
                          {order.orderType} / {order.paymentMethod}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewOrder(order)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
                          >
                            <FaEye /> Переглянути
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRepeatOrder(order)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <FaRedoAlt /> Повторити
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page === 1}
                >
                  Назад
                </button>
                <span className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page === totalPages}
                >
                  Вперед
                </button>
              </div>
            )}
          </div>
        )}

        {selectedOrder && (
          <div
            className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <header className="px-6 py-4 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Замовлення #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedOrder.createdAt)} · {selectedOrder.orderType} ·{" "}
                    {selectedOrder.paymentMethod}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Закрити
                </button>
              </header>

              <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-12rem)]">
                <section className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm">
                  <h4 className="text-gray-800 font-semibold mb-2">Інформація</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Клієнт:</span>{" "}
                      <span className="text-gray-900 font-medium">
                        {selectedOrder.customer?.name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Створив:</span>{" "}
                      <span className="text-gray-900">
                        {selectedOrder.createdBy?.fullName || "—"}
                      </span>
                    </div>
                    {selectedOrder.manager && (
                      <div>
                        <span className="text-gray-500">Менеджер:</span>{" "}
                        <span className="text-gray-900">
                          {selectedOrder.manager.fullName}
                        </span>
                      </div>
                    )}
                    {selectedOrder.shippingDepartment && (
                      <div>
                        <span className="text-gray-500">Точка відправки:</span>{" "}
                        <span className="text-gray-900">
                          {selectedOrder.shippingDepartment.name}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Коментар:</span>{" "}
                      <span className="text-gray-900">
                        {selectedOrder.comment || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Загальна вага:</span>{" "}
                      <span className="text-gray-900">
                        {selectedOrder.totals.totalWeight.toFixed(3)} кг
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Обʼєм:</span>{" "}
                      <span className="text-gray-900">
                        {selectedOrder.totals.totalVolume.toFixed(3)} м³
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Вартість:</span>{" "}
                      <span className="text-gray-900 font-semibold">
                        {selectedOrder.totals.totalDiscountedPrice.toFixed(2)} грн
                      </span>
                    </div>
                  </div>
                </section>

                <section className="border border-gray-200 rounded-md">
                  <header className="bg-gray-100 px-4 py-3 border-b font-semibold text-gray-800">
                    Позиції замовлення
                  </header>
                  <div className="overflow-auto">
                    <table className="min-w-full text-sm text-gray-700">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Код</th>
                          <th className="px-4 py-2 text-left">Найменування</th>
                          <th className="px-4 py-2 text-right">Ціна</th>
                          <th className="px-4 py-2 text-right">К-сть</th>
                          <th className="px-4 py-2 text-right">Сума</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={`${selectedOrder.id}-${item.id}`}>
                            <td className="px-4 py-2 text-blue-600 font-medium">
                              {item.productCode}
                            </td>
                            <td className="px-4 py-2 text-gray-900">
                              {item.productName}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.priceWithDiscount.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.quantity.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {item.lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <footer className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleExportOrder(selectedOrder, "pdf")}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition"
                >
                  <FaFilePdf /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExportOrder(selectedOrder, "excel")}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm transition"
                >
                  <FaFileExcel /> Excel
                </button>
                <button
                  type="button"
                  onClick={() => handleRepeatOrder(selectedOrder)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition"
                >
                  <FaRedoAlt /> Повторити замовлення
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm transition"
                >
                  Закрити
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
