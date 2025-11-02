import { useNavigate } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";
import { useCart } from "../../context/CartContext.jsx";

export default function CartDrawer() {
  const {
    items,
    totalDiscountedPrice,
    totalOriginalPrice,
    totalQuantity,
    totalWeight,
    totalVolume,
    isDrawerOpen,
    closeDrawer,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeDrawer();
    navigate("/cart");
  };

  if (!isDrawerOpen) {
    return null;
  }

  const hasItems = items.length > 0;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-label="Міні-корзина"
      >
        <header className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Ваше замовлення</h2>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={closeDrawer}
          >
            Закрити
          </button>
        </header>

        <section className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {hasItems ? (
            items.map((item) => (
              <article key={item.id} className="border border-gray-200 rounded-md p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Код: {item.code}</p>
                    <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Видалити ${item.name}`}
                  >
                    <FaTrashAlt />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <span className="block text-gray-500">Ціна зі знижкою</span>
                    <span className="font-medium">{item.priceWithDiscount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Ціна</span>
                    <span className="font-medium">{item.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Вага (кг)</span>
                    <span className="font-medium">{item.weight.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Обʼєм (м³)</span>
                    <span className="font-medium">{item.volume.toFixed(3)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-700 font-medium" htmlFor={`qty-${item.id}`}>
                    Кількість
                  </label>
                  <input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => updateItemQuantity(item.id, event.target.value)}
                    className="w-24 border rounded-md px-2 py-1 text-center"
                  />
                </div>
              </article>
            ))
          ) : (
            <p className="text-center text-gray-500">Корзина порожня. Додайте товари, щоб продовжити.</p>
          )}
        </section>

        <footer className="px-6 py-5 border-t space-y-4 bg-gray-50">
          {hasItems && (
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span>Загальна кількість, од.:</span><span>{totalQuantity.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Сума без знижки, грн:</span><span>{totalOriginalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Ваша вартість, грн:</span><span>{totalDiscountedPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Загальна вага, кг:</span><span>{totalWeight.toFixed(3)}</span></div>
              <div className="flex justify-between"><span>Загальний обʼєм, м³:</span><span>{totalVolume.toFixed(3)}</span></div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md disabled:bg-gray-400"
              onClick={handleCheckout}
              disabled={!hasItems}
            >
              Перейти до оформлення
            </button>
            <button
              type="button"
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-md"
              onClick={closeDrawer}
            >
              Продовжити покупки
            </button>
            {hasItems && (
              <button
                type="button"
                className="w-full text-red-600 hover:text-red-700 text-sm"
                onClick={clearCart}
              >
                Очистити корзину
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  );
}
