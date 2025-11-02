import { useState } from "react";
import HomeLayout from "../components/HomeLayout";

const mockProducts = [
  {
    id: 1,
    code: "701-01-1",
    name: "Деревозахист - грунтовка NOVOTEX BASE 1л",
    availability: [
      { branch: "11 - Главный склад Одесса", quantity: 75 },
      { branch: "77 - Склад Филиал Киев", quantity: 28 },
      { branch: "79 - Склад Филиал Луцк", quantity: 12 }
    ]
  },
  {
    id: 2,
    code: "701-01-20",
    name: "Деревозахист - грунтовка NOVOTEX BASE 20л",
    availability: [
      { branch: "11 - Главный склад Одесса", quantity: 0 },
      { branch: "77 - Склад Филиал Киев", quantity: 5 }
    ]
  },
  {
    id: 3,
    code: "702-00-1",
    name: "Деревозахист - засіб NOVOTEX ULTRA безбарвний 1л",
    availability: [
      { branch: "11 - Главный склад Одесса", quantity: 18 },
      { branch: "103 - Магазин на Ильфа и Петрова Одесса", quantity: 4 },
      { branch: "301 - Магазин на Ровенской Луцк", quantity: 2 }
    ]
  },
  {
    id: 4,
    code: "702-00-3",
    name: "Деревозахист - засіб NOVOTEX ULTRA безбарвний 2.5л",
    availability: [
      { branch: "11 - Главный склад Одесса", quantity: 21 }
    ]
  },
  {
    id: 5,
    code: "105-01-2",
    name: "Універсальна шпаклівка MIXON-UNI 2кг",
    availability: [
      { branch: "11 - Главный склад Одесса", quantity: 300 },
      { branch: "77 - Склад Филиал Киев", quantity: 46 },
      { branch: "79 - Склад Филиал Луцк", quantity: 15 },
      { branch: "301 - Магазин на Ровенской Луцк", quantity: 2 }
    ]
  }
];

const fakeApiCall = (callback) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(callback()), 500);
  });

const sumAvailability = (availability) =>
  availability.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

export default function ViewAvailabilityByCode() {
  const [codeQuery, setCodeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchMessage, setSearchMessage] = useState(
    "Введите код товара или його часть, чтобы увидеть наличие"
  );

  const handleSearch = async (type) => {
    const trimmedCode = codeQuery.trim();
    const trimmedName = nameQuery.trim();

    if (type === "code" && !trimmedCode) {
      setSearchMessage("Введите код товара для поиска");
      setProducts([]);
      return;
    }

    if (type === "name" && trimmedName.length < 3) {
      setSearchMessage("Введите минимум 3 символа названия для поиска");
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setSearchMessage("");

    const results = await fakeApiCall(() => {
      if (type === "code") {
        return mockProducts.filter(
          (product) => product.code.toLowerCase() === trimmedCode.toLowerCase()
        );
      }
      return mockProducts.filter((product) =>
        product.name.toLowerCase().includes(trimmedName.toLowerCase())
      );
    });

    setProducts(results);
    setLastUpdated(
      new Date().toLocaleString("uk-UA", {
        dateStyle: "short",
        timeStyle: "short"
      })
    );
    setIsLoading(false);

    if (results.length === 0) {
      setSearchMessage("Товары по заданным параметрам не найдены");
    }
  };

  const handleCodeSubmit = (event) => {
    event.preventDefault();
    handleSearch("code");
  };

  const handleNameSubmit = (event) => {
    event.preventDefault();
    handleSearch("name");
  };

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col min-h-0">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <a href="/home" className="text-blue-600 hover:underline">
                Головна
              </a>
            </li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center">
              <span className="text-gray-700">Просмотр наличия по коду</span>
            </li>
          </ol>
        </nav>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Просмотр наличия по коду
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleCodeSubmit}
            className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Поиск по коду
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Введите полный код товара и нажмите кнопку поиска
            </p>
            <input
              id="code-search"
              type="text"
              value={codeQuery}
              onChange={(event) => setCodeQuery(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Например, 701-01-1"
            />
            <button
              type="submit"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              disabled={isLoading}
            >
              {isLoading ? "Поиск..." : "Искать"}
            </button>
          </form>

          <form
            onSubmit={handleNameSubmit}
            className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Поиск по части названия
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Введите часть названия (не менее 3 символов) и нажмите кнопку поиска
            </p>
            <input
              id="name-search"
              type="text"
              value={nameQuery}
              onChange={(event) => setNameQuery(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Например, NOVOTEX"
            />
            <button
              type="submit"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              disabled={isLoading}
            >
              {isLoading ? "Поиск..." : "Искать"}
            </button>
          </form>
        </div>

        {isLoading && (
          <p className="mt-8 text-center text-gray-600">Поиск данных...</p>
        )}

        {!isLoading && searchMessage && (
          <p className="mt-8 text-center text-gray-500">{searchMessage}</p>
        )}

        {!isLoading && products.length > 0 && (
          <div className="mt-8 flex-1 flex flex-col overflow-hidden">
            <p className="text-sm text-gray-700 font-semibold mb-3">
              Дата обновления данных - {lastUpdated}
            </p>

            <div
              className="hidden md:block border rounded shadow-sm overflow-x-auto overflow-y-auto"
              style={{ maxHeight: "22vh" }}
            >
              <table className="w-full table-fixed text-sm align-middle min-w-[60rem]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">№</th>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Код товара</th>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Наименование</th>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Филиалы</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Итого</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const total = sumAvailability(product.availability);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="p-2 border-b text-gray-700">{index + 1}</td>
                        <td className="p-2 border-b text-gray-700 whitespace-nowrap">{product.code}</td>
                        <td className="p-2 border-b text-gray-700">{product.name}</td>
                        <td className="p-2 border-b text-gray-700">
                          <ul className="space-y-1 text-sm text-gray-600">
                            {product.availability.map((item) => (
                              <li key={item.branch} className="flex justify-between gap-2">
                                <span className="truncate">{item.branch}</span>
                                <span className="font-medium text-gray-900">{Number(item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-2 border-b text-gray-700 text-right font-semibold text-gray-900">
                          {total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4 overflow-y-auto" style={{ maxHeight: "22vh" }}>
              {products.map((product, index) => {
                const total = sumAvailability(product.availability);
                return (
                  <div key={product.id} className="bg-gray-50 p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base text-gray-900">{product.name}</h3>
                      <span className="text-sm text-gray-600 ml-2">№ {index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      {product.availability.map((item) => (
                        <div key={item.branch} className="flex justify-between gap-2">
                          <span className="truncate">{item.branch}</span>
                          <span className="font-semibold text-gray-900">{Number(item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <span className="font-semibold text-gray-700 block">Всього:</span>
                      <span className="font-bold text-lg text-blue-600">{total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
