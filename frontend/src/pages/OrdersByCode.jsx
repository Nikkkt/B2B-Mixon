import { useMemo, useState } from "react";
import HomeLayout from "../components/HomeLayout";
import { FaShoppingCart, FaUpload } from "react-icons/fa";
import * as XLSX from 'xlsx';
import { useCart } from "../context/CartContext.jsx";
import { lookupProductsByCodes } from "../api/ordersApi";

const parseQuantity = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  const normalized = parseFloat(String(value).replace(',', '.'));
  return Number.isNaN(normalized) ? 0 : normalized;
};

const formatDecimal = (value, digits = 2) => {
  if (value === null || value === undefined) {
    return "---";
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return String(value);
  }
  return number.toFixed(digits);
};

const getStockDepartmentLabel = (user, fallback = "—") =>
  user?.departmentShopName || user?.defaultBranchName || fallback;

const mapLookupResultToProduct = (result) => ({
  id: result.productId || result.code,
  code: result.code,
  name: result.name,
  availability: result.availability !== null && result.availability !== undefined ? formatDecimal(result.availability) : "---",
  price: formatDecimal(result.price),
  priceWithDiscount: formatDecimal(result.priceWithDiscount),
  discount: formatDecimal(result.discountPercent),
  weight: formatDecimal(result.weight, 3),
  volume: formatDecimal(result.volume, 3),
  requestedQuantity: String(result.requestedQuantity ?? 0),
  isError: result.isError,
  errorMessage: result.errorMessage,
});

export default function OrdersByCode() {
  const [skuList, setSkuList] = useState("");
  const [quantityList, setQuantityList] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("Файл не обрано");

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadWarning, setUploadWarning] = useState("");
  
  const [orderQuantities, setOrderQuantities] = useState({});
  const { addItem, openDrawer, currentUser } = useCart();

  const canSeeStockAndPrices = Boolean(
    currentUser?.hasFullAccess || (currentUser?.productGroupAccessIds?.length ?? 0) > 0
  );
  const showAccessWarning = Boolean(currentUser) && !canSeeStockAndPrices;
  const stockDepartmentLabel = useMemo(
    () => getStockDepartmentLabel(currentUser),
    [currentUser]
  );

  const lookupAndProcess = async (items, onError) => {
    if (!items || items.length === 0) {
      onError?.("Список кодів порожній. Додайте принаймні один рядок.");
      setProducts([]);
      setOrderQuantities({});
      setIsLoading(false);
      return;
    }

    try {
      const results = await lookupProductsByCodes(items);
      const mapped = results.map(mapLookupResultToProduct);
      processFoundProducts(mapped);
      onError?.(null);
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Не вдалося виконати пошук товарів.";
      onError?.(message);
      if (!onError) {
        alert(message);
      }
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (productId, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setOrderQuantities(prev => ({
        ...prev,
        [productId]: value
      }));
    }
  };

  const processFoundProducts = (foundProducts) => {
    setProducts(foundProducts);
    const initialQuantities = {};
    foundProducts.forEach(product => {
      initialQuantities[product.id] = product.requestedQuantity;
    });
    setOrderQuantities(initialQuantities);
    setIsLoading(false);
  };

  const handleTextareaSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProducts([]);
    setUploadWarning("");
    const skus = skuList.split('\n').filter(s => s.trim() !== "");
    const quantities = quantityList.split('\n').filter(q => q.trim() !== "");
    const itemsToFind = skus.map((sku, index) => ({
      code: sku.trim(),
      quantity: parseQuantity(quantities[index] ? quantities[index].trim() : "0")
    })).filter(item => item.code);
    await lookupAndProcess(itemsToFind, (message) => {
      if (message) {
        alert(message);
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
      setUploadWarning("");
    } else {
      setSelectedFile(null);
      setFileName("Файл не обрано");
    }
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadWarning("Будь ласка, оберіть Excel-файл перед завантаженням.");
      return;
    }
    setIsLoading(true);
    setProducts([]);
    setUploadWarning("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (!json.length) {
        setUploadWarning("Файл не містить даних для обробки.");
        setIsLoading(false);
        return;
      }

      const normalizeHeader = (value) => String(value || "").trim().toLowerCase();
      const headerRow = json[0] || [];
      const hasHeader =
        normalizeHeader(headerRow[0]) === "код" &&
        (normalizeHeader(headerRow[1]) === "количество" || normalizeHeader(headerRow[1]) === "кількість");

      const dataRows = hasHeader ? json.slice(1) : json;
      if (!dataRows.length) {
        setUploadWarning("Файл не містить рядків з кодами товарів.");
        setIsLoading(false);
        return;
      }

      const itemsToFind = dataRows
        .filter(row => row[0] && row[1]) 
        .map(row => ({
          code: String(row[0]).trim(),
          quantity: parseQuantity(row[1])
        }));
      await lookupAndProcess(itemsToFind, (message) => {
        if (message) {
          setUploadWarning(message);
        } else {
          setUploadWarning("");
        }
      });
    };
    reader.onerror = () => {
      setUploadWarning("Не вдалося прочитати файл. Спробуйте ще раз або оберіть інший файл.");
      setIsLoading(false);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleFinalAddToCart = () => {
    const itemsForCart = products
      .map(product => ({
        ...product,
        quantity: parseFloat(orderQuantities[product.id] || 0)
      }))
      .filter(product => !product.isError && product.quantity > 0);
    if (itemsForCart.length === 0) {
      alert("Немає товарів для додавання (кількість повинна бути > 0)");
      return;
    }
    itemsForCart.forEach((entry) => {
      addItem(entry, entry.quantity);
    });
    openDrawer();
    alert(`Додано ${itemsForCart.length} позицій у корзину`);
    setProducts([]);
    setOrderQuantities({});
    setSkuList("");
    setQuantityList("");
    setSelectedFile(null);
    setFileName("Файл не обрано");
  };


  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Головна</a></li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center"><span className="text-gray-700">Замовлення по кодах</span></li>
          </ol>
        </nav>
        <div className="space-y-4 mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <h2 className="text-2xl font-bold text-gray-800">Замовлення по кодах</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-blue-100 rounded-xl bg-blue-50/60 p-4 text-sm text-gray-700 flex gap-3">
              <div className="text-blue-600 text-xl">
                <FaUpload />
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Варіант 1 — Excel</p>
                <p>Завантажте файл з двома колонками: <strong>Код</strong> та <strong>Кількість</strong>.</p>
              </div>
            </div>
            <div className="border border-emerald-100 rounded-xl bg-emerald-50/70 p-4 text-sm text-gray-700 flex gap-3">
              <div className="text-emerald-600 text-xl">
                <FaShoppingCart />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Варіант 2 — Вставити коди</p>
                <p>Вставте списки кодів і кількостей вручну. Система знайде товари автоматично.</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleFileUpload} className="mb-2">
          <div className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-blue-50 p-4 md:p-6 shadow-inner">
            <div className="flex items-start gap-3 text-blue-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-semibold text-sm">XLS</span>
              <div>
                <p className="font-semibold text-base">Завантаження Excel</p>
                <p className="text-xs text-blue-700/80">Таблиця має починатися з колонок "Код" та "Количество".</p>
              </div>
            </div>

            {uploadWarning && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800 flex gap-3">
                <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/90 text-red-600 font-bold">!</span>
                <p>{uploadWarning}</p>
              </div>
            )}

            <label
              htmlFor="orders-code-file"
              className="flex flex-wrap items-center justify-between gap-3 w-full cursor-pointer rounded-xl border border-dashed border-blue-300 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-sm transition hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="flex flex-col gap-0.5">
                <span className="truncate max-w-full sm:max-w-[260px] font-medium text-gray-900">{fileName}</span>
                <span className="text-xs text-gray-500">Підтримуються .xls / .xlsx до 10 МБ</span>
              </div>
              <span className="ml-auto sm:ml-3 rounded-lg bg-blue-600 px-4 py-1.5 text-center text-sm font-semibold text-white shadow-blue-200 shadow hover:bg-blue-700">Обрати</span>
            </label>
            <input
              id="orders-code-file"
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">i</span>
                Приклад таблиці (перші рядки)
              </div>
              <table className="w-full text-sm text-gray-700">
                <thead>
                  <tr>
                    <th className="text-left font-semibold text-blue-800 pb-2">Код</th>
                    <th className="text-left font-semibold text-blue-800 pb-2">Количество</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  <tr className="border-t border-blue-100">
                    <td className="py-1.5 pr-4">105-01-2</td>
                    <td className="py-1.5">10</td>
                  </tr>
                  <tr className="border-t border-blue-100">
                    <td className="py-1.5 pr-4">3000-01-2</td>
                    <td className="py-1.5">8</td>
                  </tr>
                  <tr className="border-t border-blue-100">
                    <td className="py-1.5 pr-4">M40-01-04-N</td>
                    <td className="py-1.5">3</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-modern btn-modern--primary"
              >
                {isLoading ? "Завантаження..." : "Показати"}
              </button>
            </div>
          </div>
        </form>
        <div className="my-5 flex items-center gap-3 px-2">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></span>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">або</span>
          <span className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></span>
        </div>
        <form
          onSubmit={handleTextareaSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50 p-4 md:p-6 shadow-inner"
        >
          <div className="flex items-start gap-3 text-emerald-900">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm">TXT</span>
            <div>
              <p className="font-semibold text-base">Ручне введення кодів</p>
              <p className="text-xs text-emerald-700/80">Скопіюйте коди та кількості з Excel/листів — ми вирівняємо їх автоматично за рядками.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-3 shadow-sm">
                <div className="mb-2 text-sm font-semibold text-emerald-900">Список кодів</div>
                <textarea
                  id="sku-list"
                  rows="4"
                  placeholder={"105-01-2\n3000-01-2\nM40-01-04-N"}
                  className="w-full min-h-[100px] resize-none rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-mono tracking-wide text-emerald-900 shadow-inner focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={skuList}
                  onChange={e => setSkuList(e.target.value)}
                ></textarea>
                <p className="mt-2 text-xs text-emerald-700/70">Вводьте один код на рядок.</p>
              </div>
            </div>
            <div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-3 shadow-sm">
                <div className="mb-2 text-sm font-semibold text-emerald-900">Кількості</div>
                <textarea
                  id="quantity-list"
                  rows="4"
                  placeholder={"10\n8\n3"}
                  className="w-full min-h-[100px] resize-none rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-mono tracking-wide text-emerald-900 shadow-inner focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={quantityList}
                  onChange={e => setQuantityList(e.target.value)}
                ></textarea>
                <p className="mt-2 text-xs text-emerald-700/70">Кількість відповідає рядку зліва.</p>
              </div>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="mt-2 self-end btn-modern btn-modern--primary">
            {isLoading ? "Завантаження..." : "Показати"}
          </button>
        </form>
        
        {isLoading && (
          <p className="mt-8 text-center text-gray-600">Пошук товарів...</p>
        )}

        {products.length > 0 && (
          <div className="mt-8 flex-1 flex flex-col overflow-hidden min-h-0 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-inner">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Результат пошуку</h3>
                <p className="text-xs text-gray-400">Підрозділ для залишків: {stockDepartmentLabel}</p>
                {showAccessWarning && (
                  <p className="mt-2 text-xs text-amber-700">Ціни та залишки приховані. Зверніться до адміністратора для доступу.</p>
                )}
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                {products.length} позицій
              </span>
            </div>
            
            <div className="flex-1 overflow-auto min-h-0">
              <div className="hidden md:block table-scroll custom-scrollbar rounded-2xl border border-gray-100 bg-white shadow">
                <table className="w-full text-sm align-middle">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">№</th>
                      <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Код товара</th>
                      <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Наименование</th>
                      {canSeeStockAndPrices && (
                        <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Наявність</th>
                      )}
                      <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Замовлення</th>
                      {canSeeStockAndPrices && (
                        <>
                          <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Ціна</th>
                          <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">% скидки</th>
                          <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Ціна зі скидкою</th>
                        </>
                      )}
                      <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Вага (брутто)</th>
                      <th className="sticky top-0 border-b border-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Об'єм</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`${product.isError ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'} border-b border-gray-100 transition ${product.isError ? 'hover:bg-red-100' : 'hover:bg-blue-50/60'}`}
                      >
                        <td className="border-r border-gray-100 p-2 text-gray-600 font-medium">{index + 1}</td>
                        <td className="border-r border-gray-100 p-2 text-gray-700 font-semibold">{product.code}</td>
                        <td className="border-r border-gray-100 p-2 text-gray-700">{product.name}</td>
                        {canSeeStockAndPrices && (
                          <td className="border-r border-gray-100 p-2 text-center">
                            <span className={`inline-flex min-w-[60px] items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${product.isError ? 'border-red-200 bg-red-100 text-red-700' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                              {product.availability || '---'}
                            </span>
                          </td>
                        )}
                        <td className="border-r border-gray-100 p-2 text-center">
                          <input 
                            type="text"
                            value={orderQuantities[product.id] || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className={`w-20 text-center text-sm rounded-xl border px-3 py-1.5 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 ${product.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-900'}`}
                            placeholder="0.00"
                            disabled={product.isError}
                          />
                        </td>
                        {canSeeStockAndPrices && (
                          <>
                            <td className="border-r border-gray-100 p-2 text-right text-gray-700">{product.price}</td>
                            <td className="border-r border-gray-100 p-2 text-right text-gray-700">{product.discount}</td>
                            <td className="border-r border-gray-100 p-2 text-right text-gray-700">{product.priceWithDiscount}</td>
                          </>
                        )}
                        <td className="border-r border-gray-100 p-2 text-right text-gray-700">{product.weight}</td>
                        <td className="p-2 text-right text-gray-700">{product.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {products.map((product) => (
                  <div key={product.id} className={`p-4 rounded-lg shadow border ${product.isError ? 'bg-red-100' : 'bg-gray-50'}`}>
                    <h3 className={`font-bold text-base ${product.isError ? 'text-red-700' : 'text-gray-900'}`}>{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>
                    
                    {!product.isError && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          {canSeeStockAndPrices && (
                            <>
                              <div><span className="font-semibold text-gray-700 block">Ціна:</span><span className="text-gray-900">{product.price}</span></div>
                              <div><span className="font-semibold text-gray-700 block">Наявність:</span><span className="text-gray-900">{product.availability || '---'}</span></div>
                            </>
                          )}
                          <div><span className="font-semibold text-gray-700 block">Вага:</span><span className="text-gray-900">{product.weight}</span></div>
                          <div><span className="font-semibold text-gray-700 block">Об'єм:</span><span className="text-gray-900">{product.volume}</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium">Заказ:</label>
                          <input 
                            type="text"
                            value={orderQuantities[product.id] || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className="w-24 text-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
                            placeholder="0.00"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                type="button"
                onClick={handleFinalAddToCart}
                className="btn-modern btn-modern--primary"
              >
                <FaShoppingCart />
                Додати до замовлення
              </button>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}