import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaListUl, FaEye, FaRedoAlt, FaFilePdf, FaFileExcel } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import { useCart } from "../context/CartContext.jsx";

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const ROLE_LABELS = {
  admin: "Адміністратор",
  manager: "Менеджер",
  user: "Користувач",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function OrderHistory() {
  const {
    orderHistory,
    currentUser,
    users,
    customers,
    setCurrentUser,
    activeCustomerId,
    setActiveCustomerId,
    orderMatchesUser,
    addItem,
    openDrawer,
    clearCart,
  } = useCart();
  const location = useLocation();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [page, setPage] = useState(1);

  const newOrderId = location.state?.newOrderId;

  const filteredOrders = useMemo(() => {
    return (orderHistory ?? []).filter((order) => orderMatchesUser(order, currentUser));
  }, [orderHistory, currentUser, orderMatchesUser]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, pageSize, clampedPage]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleRepeatOrder = (order) => {
    if (!order?.items?.length) {
      return;
    }
    clearCart();
    order.items.forEach((item) => {
      addItem(item, item.quantity);
    });
    openDrawer();
  };

  const handleExport = (type) => {
    // TODO: Replace with real export integration
    alert(`Експорт в ${type.toUpperCase()} зараз не реалізований (стаб).`);
  };

  const handleRoleSwitch = (roleKey) => {
    const user = users[roleKey];
    if (!user) {
      return;
    }
    setCurrentUser(user);
    setActiveCustomerId(getDefaultActiveCustomerId(user));
    setPage(1);
  };

  const handleCustomerChange = (event) => {
    setActiveCustomerId(event.target.value || null);
    setPage(1);
  };

  const availableCustomers = useMemo(() => {
    if (currentUser.role === "admin") {
      return customers;
    }
    if (currentUser.role === "manager") {
      return customers.filter((customer) => currentUser.managedCustomerIds?.includes(customer.id));
    }
    return customers.filter((customer) => customer.id === currentUser.id);
  }, [customers, currentUser]);

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Головна</a></li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center"><span className="text-gray-700">Історія замовлень</span></li>
          </ol>
        </nav>

        <header className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Історія замовлень</h2>
              <p className="text-sm text-gray-500">Переглядайте, експортуйте та повторюйте замовлення клієнтів.</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-2 text-sm">
              <FaListUl />
              <span>Знайдено: {filteredOrders.length}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(users).map(([key, user]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleSwitch(key)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border transition ${user.id === currentUser.id ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}`}
                >
                  {ROLE_LABELS[user.role] || user.role}: {user.name}
                </button>
              ))}
            </div>

            {(currentUser.role === "manager" || currentUser.role === "admin") && (
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="customer-filter" className="font-medium text-gray-700">Клієнт:</label>
                <select
                  id="customer-filter"
                  value={activeCustomerId ?? ""}
                  onChange={handleCustomerChange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Всі клієнти</option>
                  {availableCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm border border-red-200 hover:bg-red-200"
              >
                <FaFilePdf /> PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport("excel")}
                className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm border border-green-200 hover:bg-green-200"
              >
                <FaFileExcel /> Excel
              </button>
            </div>
          </div>
        </header>

        {newOrderId && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm">
            Нове замовлення <span className="font-semibold">{newOrderId}</span> успішно відправлено.
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
            <p className="text-lg font-medium">Немає замовлень, які відповідають умовам.</p>
            <p className="text-sm">Спробуйте змінити роль або клієнта.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-gray-500 mb-2">
              <div>Сторінка {clampedPage} із {totalPages}</div>
              <div className="flex items-center gap-2">
                <span>Показувати:</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size} на стор.</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm text-gray-800">
                <thead className="bg-gray-50">
                  <tr className="text-left font-semibold">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Клієнт</th>
                    <th className="px-4 py-3">К-сть, од.</th>
                    <th className="px-4 py-3">Вага, кг</th>
                    <th className="px-4 py-3">Обʼєм, м³</th>
                    <th className="px-4 py-3">Вартість, грн</th>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3 text-center">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-blue-600 align-top">{order.id}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-gray-900 font-medium">{order.customer?.name || "—"}</div>
                        <div className="text-xs text-gray-500">Створено: {ROLE_LABELS[users[order.createdBy]?.role] || ""}</div>
                      </td>
                      <td className="px-4 py-3 align-top">{order.totals.quantity.toFixed(2)}</td>
                      <td className="px-4 py-3 align-top">{order.totals.weight.toFixed(3)}</td>
                      <td className="px-4 py-3 align-top">{order.totals.volume.toFixed(3)}</td>
                      <td className="px-4 py-3 align-top font-semibold text-gray-900">{order.totals.discountedPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 align-top text-sm text-gray-600">
                        <div>{formatDate(order.createdAt)}</div>
                        <div className="text-xs text-gray-500">{order.orderType} / {order.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewOrder(order)}
                            className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm hover:bg-blue-200"
                          >
                            <FaEye /> Переглянути
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRepeatOrder(order)}
                            className="flex items-center justify-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm hover:bg-green-200"
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
                  className="px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200"
                  disabled={clampedPage === 1}
                >
                  Назад
                </button>
                <span className="px-3 py-1">{clampedPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200"
                  disabled={clampedPage === totalPages}
                >
                  Вперед
                </button>
              </div>
            )}
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <header className="px-6 py-4 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Замовлення #{selectedOrder.id}</h3>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)} · {selectedOrder.orderType} · {selectedOrder.paymentMethod}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Закрити
                </button>
              </header>

              <div className="px-6 py-4 space-y-4 overflow-y-auto">
                <section className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm">
                  <h4 className="text-gray-800 font-semibold mb-2">Інформація</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><span className="text-gray-500">Клієнт:</span> <span className="text-gray-900 font-medium">{selectedOrder.customer?.name || "—"}</span></div>
                    <div><span className="text-gray-500">Створив:</span> <span className="text-gray-900">{users[selectedOrder.createdBy]?.name || selectedOrder.createdBy}</span></div>
                    <div><span className="text-gray-500">Коментар:</span> <span className="text-gray-900">{selectedOrder.comment || "—"}</span></div>
                    <div><span className="text-gray-500">Загальна вага:</span> <span className="text-gray-900">{selectedOrder.totals.weight.toFixed(3)} кг</span></div>
                    <div><span className="text-gray-500">Обʼєм:</span> <span className="text-gray-900">{selectedOrder.totals.volume.toFixed(3)} м³</span></div>
                    <div><span className="text-gray-500">Вартість:</span> <span className="text-gray-900 font-semibold">{selectedOrder.totals.discountedPrice.toFixed(2)} грн</span></div>
                  </div>
                </section>

                <section className="border border-gray-200 rounded-md">
                  <header className="bg-gray-100 px-4 py-3 border-b font-semibold text-gray-800">Позиції замовлення</header>
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
                            <td className="px-4 py-2 text-blue-600 font-medium">{item.code}</td>
                            <td className="px-4 py-2 text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-right">{item.priceWithDiscount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{item.quantity.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-semibold">{(item.priceWithDiscount * item.quantity).toFixed(2)}</td>
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
                  onClick={() => handleRepeatOrder(selectedOrder)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <FaRedoAlt /> Повторити замовлення
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm"
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
