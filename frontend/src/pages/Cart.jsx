import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTrashAlt, FaShoppingCart } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../api/orderManagementApi";

const formatQuantity = (value) =>
  Number(value ?? 0).toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  });

const paymentOptions = [
  { value: "Готівковий", label: "Готівковий" },
  { value: "Безготівковий", label: "Безготівковий" },
];

const orderTypeOptions = [
  { value: "Поточне", label: "Поточне" },
  { value: "Відкладене", label: "Відкладене" },
  { value: "Спец замовлення", label: "Спец замовлення" },
];

export default function Cart() {
  const {
    items,
    updateItemQuantity,
    removeItem,
    clearCart,
    totalQuantity,
    totalOriginalPrice,
    totalDiscountedPrice,
    totalWeight,
    totalVolume,
    paymentMethod,
    setPaymentMethod,
    orderType,
    setOrderType,
    comment,
    setComment,
    currentUser,
  } = useCart();

  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hasItems = items.length > 0;

  const canSeePricing = Boolean(
    currentUser?.hasFullAccess || (currentUser?.productGroupAccessIds?.length ?? 0) > 0
  );
  const showAccessWarning = Boolean(currentUser) && !canSeePricing;

  // No customer account needed - orders are linked directly to users

  const totals = useMemo(
    () => ({
      quantity: formatQuantity(totalQuantity),
      originalPrice: totalOriginalPrice.toFixed(2),
      discountedPrice: totalDiscountedPrice.toFixed(2),
      weight: totalWeight.toFixed(3),
      volume: totalVolume.toFixed(3),
    }),
    [totalQuantity, totalOriginalPrice, totalDiscountedPrice, totalWeight, totalVolume]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasItems) {
      alert("Кошик порожній");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Creating order with:", {
        orderType,
        paymentMethod,
        comment
      });

      const order = await createOrder({
        orderType,
        paymentMethod,
        comment: comment || null,
      });

      console.log("Order created:", order);

      // Clear cart after successful order
      clearCart();
      setComment("");

      // Navigate to order history with success message
      navigate("/order-history", {
        state: {
          newOrderId: order.orderNumber,
          fromPath: location.pathname,
        },
      });
    } catch (error) {
      console.error("Failed to create order:", error);
      alert(`Не вдалося створити замовлення: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (hasItems && window.confirm("Очистити кошик?")) {
      clearCart();
    }
  };

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <a href="/home" className="text-blue-600 hover:underline">Головна</a>
            </li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center">
              <span className="text-gray-700">Кошик</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Кошик
          </h2>
          {hasItems && (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {items.length} позицій
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow hover:bg-red-100 disabled:opacity-50"
            disabled={!hasItems}
          >
            <FaTrashAlt /> Очистити
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">Перевірте та відредагуйте вибрані товари перед оформленням. Всі показники автоматично перераховуються.</p>
        {showAccessWarning && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ціни приховані. Зверніться до адміністратора для доступу.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          {/* Table Section - Full Width */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Вміст замовлення</h3>
              </div>
              <div className="hidden md:block overflow-x-auto">
                {hasItems ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr className="text-left text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">
                        <th className="px-4 py-3 border-b border-r border-gray-100">Код</th>
                        <th className="px-4 py-3 border-b border-r border-gray-100">Найменування</th>
                        {canSeePricing && (
                          <>
                            <th className="px-4 py-3 border-b border-r border-gray-100 text-right">Ціна</th>
                            <th className="px-4 py-3 border-b border-r border-gray-100 text-right">Зі знижкою</th>
                          </>
                        )}
                        <th className="px-4 py-3 border-b border-r border-gray-100 text-right">Кількість</th>
                        <th className="px-4 py-3 border-b border-r border-gray-100 text-right">Вага</th>
                        <th className="px-4 py-3 border-b border-r border-gray-100 text-right">Обʼєм</th>
                        <th className="px-4 py-3 border-b border-gray-100 text-center">Дії</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 transition hover:bg-blue-50/60">
                          <td className="px-4 py-3 border-r border-gray-100 text-gray-700">{item.productCode}</td>
                          <td className="px-4 py-3 border-r border-gray-100 text-gray-900 font-medium min-w-[16rem]">{item.productName}</td>
                          {canSeePricing && (
                            <>
                              <td className="px-4 py-3 border-r border-gray-100 text-right text-gray-700">{item.price.toFixed(2)}</td>
                              <td className="px-4 py-3 border-r border-gray-100 text-right">
                                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                  <span className="h-2 w-2 rounded-full bg-blue-300" />
                                  {item.priceWithDiscount.toFixed(2)}
                                </span>
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 border-r border-gray-100 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={item.quantity}
                              onChange={(event) => updateItemQuantity(item.id, event.target.value)}
                              className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-1 text-right text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-100 text-right text-gray-700">{(item.weight * item.quantity).toFixed(3)}</td>
                          <td className="px-4 py-3 border-r border-gray-100 text-right text-gray-700">{(item.volume * item.quantity).toFixed(3)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                            >
                              <FaTrashAlt />
                              <span className="hidden sm:inline">Видалити</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-10 text-center">
                    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-8 text-gray-500">
                      Додайте товари з каталогу, щоб вони зʼявились у кошику.
                    </div>
                  </div>
                )}
              </div>
          </div>

          {/* Mobile Cards - Full Width */}
          {hasItems && (
            <div className="md:hidden space-y-4">
              {items.map((item) => (
                  <div key={`card-${item.id}`} className="rounded-2xl border border-gray-100 bg-white shadow p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Код</p>
                        <p className="text-sm font-semibold text-gray-900">{item.productCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                      >
                        <FaTrashAlt /> Видалити
                      </button>
                    </div>
                    <p className="text-gray-900 font-medium">{item.productName}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      {canSeePricing && (
                        <>
                          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide">Ціна</p>
                            <p className="text-sm font-semibold text-gray-900">{item.price.toFixed(2)}</p>
                          </div>
                          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-blue-600">Зі знижкою</p>
                            <p className="text-sm font-semibold text-blue-700">{item.priceWithDiscount.toFixed(2)}</p>
                          </div>
                        </>
                      )}
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide">Вага</p>
                        <p className="text-sm font-semibold text-gray-900">{(item.weight * item.quantity).toFixed(3)}</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide">Обʼєм</p>
                        <p className="text-sm font-semibold text-gray-900">{(item.volume * item.quantity).toFixed(3)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-gray-500">Кількість</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(event) => updateItemQuantity(item.id, event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right text-sm"
                      />
                    </div>
                  </div>
              ))}
            </div>
          )}

          {/* Parameters and Results Side by Side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Parameters Block */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-inner">
              <div className="px-4 py-3 border-b border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900">Параметри замовлення</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">Форма розрахунку</label>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-gray-900 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {paymentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">Тип замовлення</label>
                  <select
                    value={orderType}
                    onChange={(event) => setOrderType(event.target.value)}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-gray-900 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {orderTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">Коментар</label>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-gray-900 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Додаткові побажання щодо замовлення"
                  />
                </div>
              </div>
            </div>

            {/* Results Block */}
            <aside className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 shadow-inner flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-emerald-100">
              <h3 className="text-lg font-semibold text-emerald-900">Підсумки</h3>
            </div>
            <div className="p-4 space-y-3 text-sm text-gray-700 flex-1">
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white/80 px-3 py-2"><span>Загальна кількість, од.:</span><span className="font-semibold text-gray-900">{totals.quantity}</span></div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white/80 px-3 py-2"><span>Загальна вага, кг:</span><span>{totals.weight}</span></div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white/80 px-3 py-2"><span>Загальний обʼєм, м³:</span><span>{totals.volume}</span></div>
              {canSeePricing && (
                <>
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2"><span>Сума без знижки, грн:</span><span className="font-semibold text-gray-900">{totals.originalPrice}</span></div>
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-900"><span>Ваша вартість, грн:</span><span>{totals.discountedPrice}</span></div>
                </>
              )}
              {!hasItems && <p className="pt-4 text-gray-500 text-sm">Кошик порожній.</p>}
            </div>
            <div className="px-4 py-5 border-t border-emerald-100 flex flex-col gap-3 bg-white/70">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow disabled:bg-gray-400"
                disabled={!hasItems || isSubmitting}
              >
                {isSubmitting ? "Відправлення..." : "Замовити"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl"
              >
                Повернутись назад
              </button>
            </div>
          </aside>
          </div>
        </form>
      </div>
    </HomeLayout>
  );
}
