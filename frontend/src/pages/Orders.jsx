import { useEffect, useMemo, useState } from "react";
import { FaShoppingCart, FaFilter, FaListOl } from "react-icons/fa";
import Select from "react-select";
import HomeLayout from "../components/HomeLayout";
import { useCart } from "../context/CartContext.jsx";
import { fetchOrderDirections, fetchOrderGroups, fetchOrderProducts } from "../api/ordersApi";
import { useNotifications } from "../context/NotificationContext.jsx";
import { pickReadableValue } from "../utils/displayName";
import { sortGroupsByNumber } from "../utils/productGroups";

const getDirectionLabel = (direction, fallback = "—") =>
  pickReadableValue([direction?.displayName, direction?.title, direction?.code, direction?.name], fallback);

const toGroupLabel = (group) => {
  const parts = [group?.groupNumber, group?.name].filter(Boolean);
  return parts.length ? parts.join(" - ") : group?.name || "—";
};

const getStockDepartmentLabel = (user, fallback = "—") =>
  pickReadableValue([user?.departmentShopName, user?.defaultBranchName], fallback);

const mapProductFromApi = (product) => ({
  id: product.id,
  code: product.code,
  name: product.name,
  availability: product.availability != null ? product.availability.toString() : "",
  price: Number(product.price ?? 0),
  priceWithDiscount: Number(product.priceWithDiscount ?? product.price ?? 0),
  discount: Number(product.discountPercent ?? 0),
  weight: Number(product.weight ?? 0),
  volume: Number(product.volume ?? 0),
  groupSerial: product.groupSerial ?? 0,
});

const parseOrderQuantity = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  const normalized = parseFloat(String(value).replace(',', '.'));
  return Number.isNaN(normalized) ? 0 : normalized;
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '46px',
    borderRadius: '0.85rem',
    border: state.isFocused ? '2px solid rgb(37 99 235)' : '1px solid rgba(59, 130, 246, 0.35)',
    background: 'linear-gradient(135deg, rgba(239,246,255,0.9), rgba(219,234,254,0.7))',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59,130,246,0.25)' : '0 1px 4px rgba(15, 23, 42, 0.06)',
    paddingLeft: '0.35rem',
    transition: 'all 150ms ease',
    '&:hover': {
      borderColor: 'rgba(59,130,246,0.7)'
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0.25rem 0.75rem'
  }),
  input: (provided) => ({
    ...provided,
    color: 'rgb(30, 64, 175)'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'rgba(59, 130, 246, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: '0.7rem'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'rgb(15, 23, 42)',
    fontWeight: 600
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'rgba(59,130,246,0.18)'
      : state.isFocused
        ? 'rgba(59,130,246,0.12)'
        : 'white',
    color: state.isSelected ? 'rgb(37, 99, 235)' : 'rgb(15, 23, 42)',
    borderRadius: '0.5rem',
    padding: '0.55rem 0.75rem',
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '1rem',
    padding: '0.35rem',
    boxShadow: '0 15px 35px rgba(15,23,42,0.12)',
    maxHeight: '16rem'
  }),
  menuList: (provided) => ({
    ...provided,
    borderRadius: '0.6rem',
    padding: '0.2rem',
    maxHeight: '15rem',
    overflowY: 'auto'
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? 'rgb(37,99,235)' : 'rgba(15,23,42,0.4)',
    transition: 'color 150ms ease',
    '&:hover': { color: 'rgb(37,99,235)' }
  })
};


export default function Orders() {
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const { addItem, openDrawer, currentUser } = useCart();
  const { warning, success, error: notifyError } = useNotifications();

  const canSeeStockAndPrices = Boolean(
    currentUser?.hasFullAccess || (currentUser?.productGroupAccessIds?.length ?? 0) > 0
  );
  const showAccessWarning = Boolean(currentUser) && !canSeeStockAndPrices;
  const stockDepartmentLabel = useMemo(
    () => getStockDepartmentLabel(currentUser),
    [currentUser]
  );

  const directionOptions = useMemo(() => directions.map((direction) => ({
    value: direction.id,
    label: getDirectionLabel(direction),
  })), [directions]);

  const groupOptions = useMemo(() => groups.map((group) => ({
    value: group.id,
    label: toGroupLabel(group),
  })), [groups]);

  const activeDirectionName = useMemo(() => {
    const found = directions.find((direction) => direction.id === selectedDirection);
    return found ? getDirectionLabel(found) : null;
  }, [directions, selectedDirection]);

  const activeGroupName = useMemo(() => {
    const found = groups.find((group) => group.id === selectedGroup);
    return found ? toGroupLabel(found) : null;
  }, [groups, selectedGroup]);

  useEffect(() => {
    let isMounted = true;
    const loadDirections = async () => {
      try {
        setErrorMessage(null);
        const response = await fetchOrderDirections();
        if (!isMounted) {
          return;
        }
        setDirections(response ?? []);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message ?? "Не вдалося завантажити направлення");
          setDirections([]);
        }
      }
    };

    loadDirections();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDirection) {
      setGroups([]);
      setProducts([]);
      setSelectedGroup(null);
      setOrderQuantities({});
      return;
    }

    let isMounted = true;
    const loadGroups = async () => {
      try {
        setIsLoadingGroups(true);
        setErrorMessage(null);
        setProducts([]);
        setSelectedGroup(null);
        setOrderQuantities({});
        const response = await fetchOrderGroups(selectedDirection);
        if (!isMounted) {
          return;
        }
        const sortedGroups = sortGroupsByNumber(response ?? []);
        setGroups(sortedGroups);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message ?? "Не вдалося завантажити групи");
          setGroups([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroups(false);
        }
      }
    };

    loadGroups();
    return () => {
      isMounted = false;
    };
  }, [selectedDirection]);

  useEffect(() => {
    if (!selectedGroup) {
      setProducts([]);
      setOrderQuantities({});
      return;
    }

    let isMounted = true;
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setErrorMessage(null);
        const response = await fetchOrderProducts(selectedGroup);
        if (!isMounted) {
          return;
        }
        const mapped = (response ?? []).map(mapProductFromApi);
        const initialQuantities = mapped.reduce((acc, product) => {
          acc[product.id] = "";
          return acc;
        }, {});
        setProducts(mapped);
        setOrderQuantities(initialQuantities);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message ?? "Не вдалося завантажити товари");
          setProducts([]);
          setOrderQuantities({});
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [selectedGroup]);

  const handleQuantityChange = (productId, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setOrderQuantities(prev => ({
        ...prev,
        [productId]: value
      }));
    }
  };

  const hasBulkSelection = useMemo(() => (
    products.some(product => parseOrderQuantity(orderQuantities[product.id]) > 0)
  ), [products, orderQuantities]);

  const handleBulkAddToCart = async () => {
    const itemsToAdd = products
      .map((product) => ({
        product,
        quantity: parseOrderQuantity(orderQuantities[product.id])
      }))
      .filter((entry) => entry.quantity > 0);

    if (itemsToAdd.length === 0) {
      warning("Вкажіть кількість хоча б для одного товару");
      return;
    }

    try {
      for (const entry of itemsToAdd) {
        await addItem(entry.product, entry.quantity);
      }

      openDrawer();
      success(`Додано ${itemsToAdd.length} поз. до кошика`);
    } catch (error) {
      console.error("Failed to bulk add products:", error);
      notifyError("Не вдалося додати товари до кошика");
    }
  };

  const handleAddToCart = async (productId) => {
    const quantity = orderQuantities[productId] || 0;
    const product = products.find(p => p.id === productId);
    const numQuantity = parseFloat(quantity);
    if (!numQuantity || numQuantity <= 0) {
      warning("Будь ласка, введіть кількість для замовлення");
      return;
    }
    try {
      await addItem(product, numQuantity);
      openDrawer();
      success(`Додано до кошика: ${product.name} (×${quantity})`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
      notifyError("Не вдалося додати товар до кошика");
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
              <span className="text-gray-700">Замовлення товарів</span> 
            </li>
          </ol>
        </nav>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Замовлення товарів
        </h2>
        <p className="text-xs text-gray-400 mb-4">Підрозділ для залишків: {stockDepartmentLabel}</p>
        {showAccessWarning && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ціни та залишки приховані. Зверніться до адміністратора для доступу.
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] mb-1">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-blue-50 p-5 shadow-inner">
            <div className="mb-4 flex items-center gap-3 text-blue-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FaFilter />
              </span>
              <div>
                <p className="text-base font-semibold">Крок 1 — фільтри</p>
                <p className="text-xs text-blue-700/80">Оберіть напрям і групу, щоб побачити доступні товари.</p>
              </div>
            </div>
            <form className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-2">Товарний напрям</label>
                  <span className="text-xs text-gray-400">обов'язково</span>
                </div>
                <Select
                  id="direction"
                  styles={customSelectStyles}
                  options={directionOptions}
                  isClearable isSearchable
                  placeholder="-- Оберіть направлення --"
                  onChange={option => setSelectedDirection(option ? option.value : null)}
                  value={directionOptions.find(o => o.value === selectedDirection) ?? null}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">Групи товарів</label>
                  <span className="text-xs text-gray-400">на основі напрямку</span>
                </div>
                <Select
                  id="group"
                  styles={customSelectStyles}
                  options={groupOptions}
                  isClearable isSearchable
                  placeholder={isLoadingGroups ? "Завантаження груп..." : (selectedDirection ? "-- Оберіть групу --" : "-- Спочатку оберіть напрям --")}
                  onChange={option => setSelectedGroup(option ? option.value : null)}
                  value={groupOptions.find(o => o.value === selectedGroup) ?? null}
                  isDisabled={!selectedDirection || isLoadingGroups}
                  isLoading={isLoadingGroups}
                />
              </div>
            </form>
            {errorMessage && (
              <p className="mt-3 rounded-lg border border-red-100 bg-red-50/80 px-3 py-2 text-sm text-red-700" role="alert">{errorMessage}</p>
            )}
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-inner">
            <div className="flex items-center gap-3 text-emerald-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <FaListOl />
              </span>
              <div className="flex-1 flex flex-col justify-center gap-1">
                <p className="text-base font-semibold">Крок 2 — додайте у кошик</p>
                <p className="text-xs text-emerald-800/80 leading-relaxed">Після завантаження списку вкажіть кількість і підтвердіть.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-5 text-sm text-emerald-900">
              <li className="flex gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-emerald-700 font-semibold text-xs">1</span>
                <div>
                  <p className="font-semibold">Оберіть напрямок</p>
                  <p className="text-xs text-emerald-700/80">Система підготує лише релевантні групи.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-emerald-700 font-semibold text-xs">2</span>
                <div>
                  <p className="font-semibold">Вкажіть групу товарів</p>
                  <p className="text-xs text-emerald-700/80">Отримаєте перелік позицій та залишків.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-emerald-700 font-semibold text-xs">3</span>
                <div>
                  <p className="font-semibold">Заповніть кількість</p>
                  <p className="text-xs text-emerald-700/80">Додавайте по одній або одразу кілька позицій.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {isLoadingProducts ? (
          <p className="mt-8 text-center text-gray-600">Завантаження товарів...</p>
        ) : products.length > 0 ? (
          <div className="mt-6 flex-1 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-inner">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-gray-800">Результат підбору</p>
                <p className="text-sm text-gray-500">
                  {activeDirectionName && activeGroupName ? `${activeDirectionName} • ${activeGroupName}` : "Вкажіть параметри, щоб побачити товари"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  {products.length} позицій
                </span>
                <button
                  type="button"
                  onClick={handleBulkAddToCart}
                  disabled={!hasBulkSelection}
                  className="btn-modern btn-modern--primary btn-modern--sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaShoppingCart className="text-sm" />
                  Додати всі
                </button>
              </div>
            </div>

            <div className="hidden md:block table-scroll custom-scrollbar rounded-2xl border border-gray-100 bg-white shadow">
              <table className="w-full text-sm align-middle">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">№</th>
                    <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Код товару</th>
                    <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Найменування</th>
                    {canSeeStockAndPrices && (
                      <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Наявність</th>
                    )}
                    <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Замовлення</th>
                    {canSeeStockAndPrices && (
                      <>
                      <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Ціна</th>
                      <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">% знижки</th>
                      <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Ціна зі знижкою</th>
                    </>
                  )}
                    <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Вага (брутто)</th>
                    <th className="sticky top-0 border-b border-r border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0">Об'єм</th>
                    <th className="sticky top-0 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 p-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">В кошик</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/80"} border-b border-gray-100 transition hover:bg-blue-50/60`}
                    >
                      <td className="border-r border-gray-100 p-2 text-gray-600 font-medium last:border-r-0">{index + 1}</td>
                      <td className="border-r border-gray-100 p-2 text-gray-700 font-semibold last:border-r-0">{product.code}</td>
                      <td className="border-r border-gray-100 p-2 text-gray-700 last:border-r-0">{product.name}</td>
                      {canSeeStockAndPrices && (
                        <td className="border-r border-gray-100 p-2 text-center last:border-r-0">
                          <span className="inline-flex min-w-[60px] items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {product.availability || "---"}
                          </span>
                        </td>
                      )}
                      <td className="border-r border-gray-100 p-2 text-center last:border-r-0">
                        <input 
                          type="number"
                          value={orderQuantities[product.id] || ''}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-20 text-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </td>
                      {canSeeStockAndPrices && (
                        <>
                          <td className="border-r border-gray-100 p-2 text-right text-gray-700 last:border-r-0">{product.price}</td>
                          <td className="border-r border-gray-100 p-2 text-right text-gray-700 last:border-r-0">{product.discount}</td>
                          <td className="border-r border-gray-100 p-2 text-right text-gray-700 last:border-r-0">{product.priceWithDiscount}</td>
                        </>
                      )}
                      <td className="border-r border-gray-100 p-2 text-right text-gray-700 last:border-r-0">{product.weight}</td>
                      <td className="border-r border-gray-100 p-2 text-right text-gray-700 last:border-r-0">{product.volume}</td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product.id)}
                          className="btn-modern btn-modern--outline btn-modern--sm"
                          title="Додати до кошика"
                        >
                          <FaShoppingCart />
                          Додати
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow">
                  
                  <h3 className="font-bold text-base text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    {canSeeStockAndPrices && (
                      <>
                        <div>
                          <span className="font-semibold text-gray-700 block">Ціна:</span>
                          <span className="text-gray-900">{product.price}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 block">Наявність:</span>
                          <span className="text-gray-900">{product.availability || '---'}</span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="font-semibold text-gray-700 block">Вага (брутто):</span>
                      <span className="text-gray-900">{product.weight}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 block">Об'єм:</span>
                      <span className="text-gray-900">{product.volume}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="text"
                      value={orderQuantities[product.id] || ''}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      className="w-24 text-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      className="btn-modern btn-modern--primary btn-modern--block"
                      title="Додати до кошика"
                    >
                      <FaShoppingCart />
                      <span>До кошика</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        ) : (
          selectedGroup && !isLoadingProducts && (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center text-sm text-gray-500">
              Для цієї групи товари не знайдені. Спробуйте інше направлення або групу.
            </div>
          )
        )}
      </div>
    </HomeLayout>
  );
}