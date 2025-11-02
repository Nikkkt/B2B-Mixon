import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import { useCart } from "../context/CartContext.jsx";

const paymentOptions = [
  { value: "Наличный", label: "Наличный" },
  { value: "Безналичный", label: "Безналичный" },
];

const orderTypeOptions = [
  { value: "Текущий", label: "Текущий" },
  { value: "Отложенный", label: "Отложенный" },
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
    submitOrder,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hasItems = items.length > 0;

  const totals = useMemo(
    () => ({
      quantity: totalQuantity.toFixed(2),
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
      return;
    }
    setIsSubmitting(true);
    try {
      const order = submitOrder();
      if (order) {
        navigate("/order-history", {
          state: {
            newOrderId: order.id,
            fromPath: location.pathname,
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (hasItems && window.confirm("Очистити корзину?")) {
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
              <span className="text-gray-700">Корзина</span>
            </li>
          </ol>
        </nav>

        <header className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Корзина</h2>
            <p className="text-sm text-gray-500">Перевірте та відредагуйте вибрані товари перед оформленням.</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md disabled:opacity-50"
            disabled={!hasItems}
          >
            Очистити корзину
          </button>
        </header>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[2fr_1fr] gap-6 flex-1">
          <section className="flex flex-col gap-6">
            <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Вміст замовлення</h3>
              </div>
              <div className="overflow-x-auto">
                {hasItems ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-gray-600 font-semibold">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Код товара</th>
                        <th className="px-4 py-3">Найменування</th>
                        <th className="px-4 py-3 text-right">Ціна</th>
                        <th className="px-4 py-3 text-right">Ціна зі знижкою</th>
                        <th className="px-4 py-3 text-right">Кількість</th>
                        <th className="px-4 py-3 text-right">Вага, кг</th>
                        <th className="px-4 py-3 text-right">Обʼєм, м³</th>
                        <th className="px-4 py-3 text-center">Дії</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{item.id}</td>
                          <td className="px-4 py-3 text-gray-700">{item.code}</td>
                          <td className="px-4 py-3 text-gray-900 font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.priceWithDiscount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(event) => updateItemQuantity(item.id, event.target.value)}
                              className="w-24 border rounded-md px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{(item.weight * item.quantity).toFixed(3)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{(item.volume * item.quantity).toFixed(3)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
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
                  <p className="px-4 py-6 text-center text-gray-500">Додайте товари з каталогу, щоб вони зʼявились у корзині.</p>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Параметри замовлення</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Форма розрахунку</label>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {paymentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип замовлення</label>
                  <select
                    value={orderType}
                    onChange={(event) => setOrderType(event.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {orderTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Коментар</label>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Додаткові побажання щодо замовлення"
                  />
                </div>
              </div>
            </div>
          </section>

          <aside className="border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Підсумки</h3>
            </div>
            <div className="p-4 space-y-3 text-sm text-gray-700 flex-1">
              <div className="flex justify-between"><span>Загальна кількість, од.:</span><span>{totals.quantity}</span></div>
              <div className="flex justify-between"><span>Сума без знижки, грн:</span><span>{totals.originalPrice}</span></div>
              <div className="flex justify-between font-semibold"><span>Ваша вартість, грн:</span><span>{totals.discountedPrice}</span></div>
              <div className="flex justify-between"><span>Загальна вага, кг:</span><span>{totals.weight}</span></div>
              <div className="flex justify-between"><span>Загальний обʼєм, м³:</span><span>{totals.volume}</span></div>
              {!hasItems && <p className="pt-4 text-gray-500 text-sm">Корзина порожня.</p>}
            </div>
            <div className="px-4 py-5 border-t flex flex-col gap-3 bg-gray-50">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md disabled:bg-gray-400"
                disabled={!hasItems || isSubmitting}
              >
                {isSubmitting ? "Відправлення..." : "Замовити"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-md"
              >
                Повернутись назад
              </button>
            </div>
          </aside>
        </form>
      </div>
    </HomeLayout>
  );
}
