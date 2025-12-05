import { useEffect, useState } from "react";
import { FaBarcode, FaFont, FaClock, FaCopy } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import {
  fetchProductAvailabilityByCode,
  searchProductsByName
} from "../api/availabilityApi";
import { pickReadableValue } from "../utils/displayName";

const formatQuantity = (value) => Number(value ?? 0).toLocaleString("uk-UA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const getBranchLabel = (branch, fallback = "—") =>
  pickReadableValue([branch?.displayName, branch?.name, branch?.code], fallback);

export default function ViewAvailabilityByCode() {
  const [codeQuery, setCodeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [productAvailability, setProductAvailability] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState(
    "Введіть код товару або скористайтеся пошуком за назвою, щоб побачити залишки."
  );
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    if (!copiedCode) {
      return;
    }
    const timeout = setTimeout(() => setCopiedCode(""), 2000);
    return () => clearTimeout(timeout);
  }, [copiedCode]);

  const handleCodeSubmit = async (event) => {
    event.preventDefault();
    const trimmedCode = codeQuery.trim();

    if (!trimmedCode) {
      setErrorMessage("Введіть код товару для пошуку.");
      setProductAvailability(null);
      setInfoMessage(
        "Введіть код товару або скористайтеся пошуком за назвою, щоб побачити залишки."
      );
      return;
    }

    setIsSearchingCode(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const result = await fetchProductAvailabilityByCode(trimmedCode);
      setProductAvailability(result);
      setLastUpdatedLabel(
        result?.lastUpdatedAt
          ? new Date(result.lastUpdatedAt).toLocaleString("uk-UA", {
              dateStyle: "short",
              timeStyle: "short"
            })
          : ""
      );

      if (!result || (result.branches?.length ?? 0) === 0) {
        setInfoMessage("Для цього товару не знайдено залишків у доступних підрозділах.");
      } else {
        setInfoMessage("");
      }
    } catch (error) {
      setProductAvailability(null);
      setLastUpdatedLabel("");
      setInfoMessage("");
      setErrorMessage(error?.message || "Не вдалося завантажити залишки.");
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleNameSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = nameQuery.trim();

    if (trimmedName.length < 3) {
      setErrorMessage("Введіть мінімум 3 символи назви для пошуку.");
      setSearchResults([]);
      return;
    }

    setIsSearchingName(true);
    setErrorMessage("");

    try {
      const results = await searchProductsByName(trimmedName);
      setSearchResults(results);

      if (results.length === 0 && !productAvailability) {
        setInfoMessage("Товари за заданим фрагментом назви не знайдені.");
      }
    } catch (error) {
      setSearchResults([]);
      setErrorMessage(error?.message || "Не вдалося виконати пошук за назвою.");
    } finally {
      setIsSearchingName(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
      }
    } catch (error) {
      console.warn("Clipboard copy failed", error);
    } finally {
      setCodeQuery(code);
    }
  };

  const branches = productAvailability?.branches ?? [];

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
              <span className="text-gray-700">Перегляд наявності за кодом</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Перегляд наявності за кодом</h2>
          {productAvailability && (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              1 позиція
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleCodeSubmit}
            className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-blue-50 p-6 shadow-inner"
          >
            <div className="flex items-center gap-3 mb-4 text-blue-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-blue-600 shadow">
                <FaBarcode />
              </span>
              <div>
                <p className="text-base font-semibold">Пошук по коду</p>
                <p className="text-xs text-blue-700/80">Введіть повний артикул та запустіть пошук</p>
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="code-search" className="text-xs uppercase tracking-wide text-gray-500">Код товару</label>
              <input
                id="code-search"
                type="text"
                value={codeQuery}
                onChange={(event) => setCodeQuery(event.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-white/90 px-4 py-2 text-sm text-gray-900 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Наприклад, 701-01-1"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-blue-300"
                disabled={isSearchingCode}
              >
                {isSearchingCode ? "Пошук..." : "Знайти"}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleNameSubmit}
            className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50 p-6 shadow-inner"
          >
            <div className="flex items-center gap-3 mb-4 text-indigo-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-indigo-600 shadow">
                <FaFont />
              </span>
              <div>
                <p className="text-base font-semibold">Пошук по назві</p>
                <p className="text-xs text-indigo-700/80">Введіть ≥3 символів назви для підбору</p>
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="name-search" className="text-xs uppercase tracking-wide text-gray-500">Назва товару</label>
              <input
                id="name-search"
                type="text"
                value={nameQuery}
                onChange={(event) => setNameQuery(event.target.value)}
                className="w-full rounded-xl border border-indigo-100 bg-white/90 px-4 py-2 text-sm text-gray-900 shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Наприклад, NOVOTEX"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-indigo-300"
                disabled={isSearchingName}
              >
                {isSearchingName ? "Пошук..." : "Знайти"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {isSearchingName && (
              <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-4 text-sm text-indigo-700 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-500">
                  <FaFont />
                </span>
                <span>Пошук товарів за назвою...</span>
              </div>
            )}

            {!isSearchingName && searchResults.length > 0 && (
              <div className="rounded-3xl border border-indigo-50 bg-gradient-to-br from-white via-indigo-50/60 to-white p-5 shadow">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-400">Підібрані товари</p>
                    <p className="text-base font-semibold text-gray-900">Результати пошуку за назвою</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    {searchResults.length} позицій
                  </span>
                </div>

                <div className="grid gap-3">
                  {searchResults.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 flex flex-col gap-2 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          <FaBarcode /> {item.code}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                        <p>Скопіюйте код, щоб переглянути залишки.</p>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.code)}
                          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          <FaCopy /> {copiedCode === item.code ? "Скопійовано" : "Копіювати"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="flex-1 min-h-0 bg-white/90 rounded-3xl border border-gray-100 shadow-inner p-5 mt-6">
          {isSearchingCode ? (
            <p className="text-center text-gray-600">Завантаження залишків...</p>
          ) : productAvailability ? (
            <div className="flex flex-col gap-4 h-full">
              <div className="rounded-[26px] border border-blue-50 bg-gradient-to-br from-white via-blue-50/40 to-white p-6 shadow">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 rounded-[20px] bg-white/70 px-4 py-3 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-blue-400">Код</p>
                    <p className="mt-2 text-2xl font-bold text-blue-900 break-words">{productAvailability.code}</p>
                  </div>
                  <div className="flex-1 rounded-[20px] bg-white/70 px-4 py-3 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Назва</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 leading-snug">{productAvailability.name}</p>
                  </div>
                  <div className="flex-1 rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4 py-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400">Загальна кількість</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{formatQuantity(productAvailability.totalQuantity)}</p>
                  </div>
                </div>

                {lastUpdatedLabel && (
                  <div className="mt-4 inline-flex items-center gap-3 rounded-[18px] border border-gray-100 bg-white/80 px-4 py-2 text-gray-600 text-sm">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                      <FaClock />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400">Оновлено</p>
                      <p className="font-semibold text-gray-800">{lastUpdatedLabel}</p>
                    </div>
                  </div>
                )}
              </div>

              {branches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <p>Доступні підрозділи: {branches.length}</p>
                  </div>

                  <div className="hidden md:block overflow-x-auto overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-lg" style={{ maxHeight: "40vh" }}>
                    <table className="w-full text-sm align-middle min-w-[40rem] border border-gray-100">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-[0.4em] text-gray-400">
                          <th className="sticky top-0 bg-white p-3 border-b border-gray-100 text-left">№</th>
                          <th className="sticky top-0 bg-white p-3 border-b border-gray-100 text-left">Підрозділ</th>
                          <th className="sticky top-0 bg-white p-3 border-b border-gray-100 text-left">Код</th>
                          <th className="sticky top-0 bg-white p-3 border-b border-gray-100 text-right">Кількість</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branches.map((branch, index) => (
                          <tr key={branch.branchId} className="transition hover:bg-blue-50/40">
                            <td className="p-3 text-gray-500 font-semibold border-b border-r border-gray-100">{index + 1}</td>
                            <td className="p-3 text-gray-900 font-medium border-b border-r border-gray-100">{getBranchLabel(branch)}</td>
                            <td className="p-3 text-gray-500 border-b border-r border-gray-100">{branch.code || "—"}</td>
                            <td className="p-3 text-right text-gray-900 font-semibold border-b border-gray-100">{formatQuantity(branch.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3 overflow-y-auto" style={{ maxHeight: "40vh" }}>
                    {branches.map((branch, index) => (
                      <div key={branch.branchId} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{getBranchLabel(branch)}</p>
                          <span className="text-xs text-gray-400">№ {index + 1}</span>
                        </div>
                        <p className="text-xs text-gray-500">Код: {branch.code || "—"}</p>
                        <p className="text-lg font-bold text-gray-900">{formatQuantity(branch.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center text-sm text-gray-500">
                  Для цього товару поки немає залишків у підрозділах.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center text-sm text-gray-500">
              {infoMessage}
            </div>
          )}
        </section>
      </div>
    </HomeLayout>
  );
}
