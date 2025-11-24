// src/pages/ViewAvailability.jsx
// (Імпорти, API, стилі - все без змін)
import { useCallback, useEffect, useMemo, useState } from "react";

import { FaClipboardList, FaProjectDiagram, FaWarehouse } from "react-icons/fa";
import Select from "react-select";
import HomeLayout from "../components/HomeLayout";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchAvailabilityBranches,
  fetchAvailabilityDirections,
  fetchAvailabilityGroups,
  fetchAvailabilityProducts
} from "../api/availabilityApi";

const resolveRole = (role) => {
  if (!role) {
    return "user";
  }

  if (typeof role === "string") {
    return role.toLowerCase();
  }

  if (typeof role === "number") {
    switch (role) {
      case 2:
        return "admin";
      case 1:
        return "manager";
      default:
        return "user";
    }
  }

  if (typeof role === "object" && "name" in role) {
    return resolveRole(role.name);
  }

  return "user";
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "46px",
    borderRadius: "0.85rem",
    border: state.isFocused ? "2px solid rgb(37 99 235)" : "1px solid rgba(59, 130, 246, 0.35)",
    background: "linear-gradient(135deg, rgba(239,246,255,0.9), rgba(219,234,254,0.7))",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.25)" : "0 1px 4px rgba(15, 23, 42, 0.06)",
    paddingLeft: "0.35rem",
    transition: "all 150ms ease",
    "&:hover": {
      borderColor: "rgba(59,130,246,0.7)"
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0.25rem 0.75rem"
  }),
  input: (provided) => ({
    ...provided,
    color: "rgb(30, 64, 175)"
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "rgba(59, 130, 246, 0.8)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: "0.7rem"
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "rgb(15, 23, 42)",
    fontWeight: 600
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "rgba(59,130,246,0.18)"
      : state.isFocused
        ? "rgba(59,130,246,0.12)"
        : "white",
    color: state.isSelected ? "rgb(37, 99, 235)" : "rgb(15, 23, 42)",
    borderRadius: "0.5rem",
    padding: "0.55rem 0.75rem",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "1rem",
    padding: "0.35rem",
    boxShadow: "0 15px 35px rgba(15,23,42,0.12)"
  }),
  menuList: (provided) => ({
    ...provided,
    borderRadius: "0.6rem",
    padding: "0.2rem"
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "rgb(37,99,235)" : "rgba(15,23,42,0.4)",
    transition: "color 150ms ease",
    "&:hover": { color: "rgb(37,99,235)" }
  })
};

export default function ViewAvailability() {
  // ... (Весь код станів та useEffect залишається без змін) ...
  const { user } = useAuth();
  const userRole = resolveRole(user?.role);
  const userBranchId = user?.defaultBranchId ?? user?.DefaultBranchId ?? null;
  const isBranchRestricted = userRole === "user";

  const [branches, setBranches] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]); 
  const [lastUpdated, setLastUpdated] = useState(""); 
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState(null); 
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const branchOptionGroups = useMemo(() => {
    if (!branches?.length) {
      return [];
    }

    const branchItems = [];
    const shopItems = [];

    branches.forEach(branch => {
      const baseLabel = branch.displayName || branch.name || branch.code || "—";
      const option = {
        value: branch.id,
        label: baseLabel,
        category: branch.category === "shop" ? "shop" : "branch",
        subtitle: branch.category === "shop" && branch.parentDisplayName
          ? `Філіал: ${branch.parentDisplayName}`
          : ""
      };

      if (option.category === "shop") {
        shopItems.push(option);
      } else {
        branchItems.push(option);
      }
    });

    const groups = [];
    if (branchItems.length) {
      groups.push({ label: "Філіали", options: branchItems });
    }
    if (shopItems.length) {
      groups.push({ label: "Магазини", options: shopItems });
    }

    return groups;
  }, [branches]);

  const flatBranchOptions = useMemo(
    () => branchOptionGroups.flatMap(group => group.options ?? []),
    [branchOptionGroups]
  );

  const renderBranchOption = useCallback((option) => (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-900">{option.label}</span>
        <span
          className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${option.category === "shop" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-700"}`}
        >
          {option.category === "shop" ? "Магазин" : "Філіал"}
        </span>
      </div>
      {option.subtitle ? (
        <span className="text-xs text-slate-500">{option.subtitle}</span>
      ) : null}
    </div>
  ), []);

  const renderBranchGroupLabel = useCallback((group) => (
    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
      <span>{group.label}</span>
      <span className="text-[10px] text-slate-400">{group.options?.length ?? 0}</span>
    </div>
  ), []);

  const directionOptions = useMemo(() => directions.map(direction => ({
    value: direction.id,
    label: direction.displayName || direction.name || direction.code || "—"
  })), [directions]);

  const groupOptions = useMemo(() => groups.map(group => ({
    value: group.id,
    label: group.name || group.groupNumber || "—"
  })), [groups]);

  const formatQuantity = (value) => Number(value ?? 0).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoadingBranches(true);
    setErrorMessage("");

    fetchAvailabilityBranches()
      .then(data => {
        if (!isMounted) {
          return;
        }

        const nextBranches = Array.isArray(data) ? data : [];
        setBranches(nextBranches);

        if (nextBranches.length === 0) {
          setSelectedBranch(null);
          return;
        }

        if (isBranchRestricted) {
          setSelectedBranch(nextBranches[0]?.id ?? null);
        } else {
          setSelectedBranch(prev => prev ?? nextBranches[0]?.id ?? null);
        }
      })
      .catch(error => {
        if (!isMounted) {
          return;
        }
        setBranches([]);
        setSelectedBranch(null);
        setErrorMessage(error.message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBranches(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isBranchRestricted]);

  useEffect(() => {
    if (selectedBranch) {
      setIsLoadingDirections(true);
      setDirections([]);
      setGroups([]);
      setProducts([]);
      setSelectedDirection(null); 
      setSelectedGroup(null);
      setTotalQuantity(0);
      setLastUpdated("");

      let isMounted = true;
      setErrorMessage("");

      fetchAvailabilityDirections(selectedBranch)
        .then(data => {
          if (!isMounted) {
            return;
          }
          setDirections(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          if (!isMounted) {
            return;
          }
          setErrorMessage(error.message);
          setDirections([]);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingDirections(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setDirections([]);
      setGroups([]);
      setProducts([]);
      setTotalQuantity(0);
      setLastUpdated("");
    }
  }, [selectedBranch]); 

  useEffect(() => {
    if (selectedDirection) {
      setIsLoadingGroups(true);
      setGroups([]);
      setProducts([]);
      setSelectedGroup(null);
      setTotalQuantity(0);
      setLastUpdated("");

      let isMounted = true;
      setErrorMessage("");

      fetchAvailabilityGroups(selectedDirection)
        .then(data => {
          if (!isMounted) {
            return;
          }
          setGroups(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          if (!isMounted) {
            return;
          }
          setErrorMessage(error.message);
          setGroups([]);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingGroups(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setGroups([]);
      setProducts([]);
      setTotalQuantity(0);
      setLastUpdated("");
    }
  }, [selectedDirection]);

  useEffect(() => {
    if (selectedGroup && selectedBranch) {
      setIsLoadingProducts(true);
      setErrorMessage("");

      let isMounted = true;

      fetchAvailabilityProducts(selectedBranch, selectedGroup)
        .then(data => {
          if (!isMounted) {
            return;
          }

          const productsPayload = data?.products ?? [];
          setProducts(productsPayload);
          setTotalQuantity(Number(data?.totalQuantity ?? 0));
          setLastUpdated(data?.lastUpdatedAt
            ? new Date(data.lastUpdatedAt).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })
            : "");
        })
        .catch(error => {
          if (!isMounted) {
            return;
          }
          setProducts([]);
          setTotalQuantity(0);
          setLastUpdated("");
          setErrorMessage(error.message);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingProducts(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setProducts([]);
      setTotalQuantity(0);
      setLastUpdated(""); 
    }
  }, [selectedGroup, selectedBranch]);

  const activeBranch = branches.find(branch => branch.id === selectedBranch);
  const activeDirection = directions.find(direction => direction.id === selectedDirection);
  const activeGroup = groups.find(group => group.id === selectedGroup);
  const totalAvailableAmount = formatQuantity(totalQuantity);

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Головна</a></li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center"><span className="text-gray-700">Перегляд наявності</span></li>
          </ol>
        </nav>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">Перегляд наявності</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              {products.length} позицій
            </span>
          </div>
          <p className="text-sm text-gray-500 max-w-3xl">Сформуйте актуальний список залишків за філіалами, товарними напрямами та групами. Оберіть параметри справа — система підготує лише релевантні дані.</p>
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr] mb-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-blue-50 p-5 shadow-inner">
              <div className="mb-5 flex items-center gap-3 text-blue-900">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <FaClipboardList />
                </span>
                <div>
                  <p className="text-base font-semibold">Крок 1 — налаштуйте фільтри</p>
                  <p className="text-xs text-blue-700/80">Спершу виберіть філіал, потім напрям і групу — ми покажемо доступні позиції.</p>
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">Філіал</label>
                    <span className="text-xs text-gray-400">обов'язково</span>
                  </div>
                  <Select
                    id="branch"
                    styles={customSelectStyles}
                    options={branchOptionGroups}
                    formatOptionLabel={renderBranchOption}
                    formatGroupLabel={renderBranchGroupLabel}
                    isSearchable
                    placeholder="-- Оберіть філіал або магазин --"
                    onChange={option => setSelectedBranch(option ? option.value : null)}
                    value={flatBranchOptions.find(o => o.value === selectedBranch) ?? null}
                    isDisabled={isBranchRestricted || isLoadingBranches}
                    isLoading={isLoadingBranches}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-2">Товарний напрям</label>
                      <span className="text-xs text-gray-400">після філіалу</span>
                    </div>
                    <Select
                      id="direction"
                      styles={customSelectStyles}
                      options={directionOptions}
                      isClearable
                      isSearchable
                      placeholder={isLoadingDirections ? "Завантаження..." : (selectedBranch ? "-- Оберіть напрям --" : "-- Спочатку оберіть філіал --")}
                      onChange={option => setSelectedDirection(option ? option.value : null)}
                      value={directionOptions.find(o => o.value === selectedDirection) ?? null}
                      isDisabled={!selectedBranch || isLoadingDirections}
                      isLoading={isLoadingDirections}
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
                      isClearable
                      isSearchable
                      placeholder={isLoadingGroups ? "Завантаження..." : (selectedDirection ? "-- Оберіть групу --" : "-- Спочатку оберіть напрям --")}
                      onChange={option => setSelectedGroup(option ? option.value : null)}
                      value={groupOptions.find(o => o.value === selectedGroup) ?? null}
                      isDisabled={!selectedDirection || isLoadingGroups}
                      isLoading={isLoadingGroups}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-inner flex flex-col gap-4">
              <div className="flex items-center gap-3 text-emerald-900">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FaProjectDiagram />
                </span>
                <div>
                  <p className="text-base font-semibold">Крок 2 — аналізуйте дані</p>
                  <p className="text-xs text-emerald-700/80">Миттєво отримайте стан залишків та час останнього оновлення.</p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FaWarehouse />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Філіал / Магазин</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {activeBranch?.displayName || activeBranch?.name || "Не вибрано"}
                      </p>
                      {activeBranch && (
                        <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${activeBranch.category === "shop" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-700"}`}>
                          {activeBranch.category === "shop" ? "Магазин" : "Філіал"}
                        </span>
                      )}
                    </div>
                    {activeBranch?.category === "shop" && activeBranch?.parentDisplayName && (
                      <p className="text-xs text-gray-500">Філіал: {activeBranch.parentDisplayName}</p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FaProjectDiagram />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Напрям</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{activeDirection?.name ?? "Не вибрано"}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <FaClipboardList />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Група</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{activeGroup?.name ?? "Не вибрано"}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-emerald-500">Сумарна кількість</p>
                  <p className="text-2xl font-bold text-emerald-700">{totalAvailableAmount}</p>
                  <p className="text-xs text-gray-400 mt-1">Останнє оновлення: {lastUpdated || "немає даних"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex-1 flex flex-col overflow-hidden">
            {isLoadingProducts ? (
              <p className="mt-8 text-center text-gray-600">Завантаження наявності...</p>
            ) : products.length > 0 ? (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">Результат підбору</p>
                    <p className="text-sm text-gray-500">
                      {activeBranch?.name || "Філіал не обрано"} • {activeDirection?.name || "Напрям не обрано"} • {activeGroup?.name || "Група не обрана"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    {lastUpdated ? `Оновлено ${lastUpdated}` : "Немає оновлень"}
                  </span>
                </div>

                <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow" style={{ maxHeight: '30vh' }}>
                  <table className="w-full text-sm align-middle">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">№</th>
                        <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Код товару</th>
                        <th className="sticky top-0 border-b border-r border-gray-100 p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Найменування</th>
                        <th className="sticky top-0 border-b border-gray-100 p-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Кількість</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr
                          key={product.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/80"} border-b border-gray-100 transition hover:bg-blue-50/60`}
                        >
                          <td className="border-r border-gray-100 p-2 text-gray-600 font-medium">{index + 1}</td>
                          <td className="border-r border-gray-100 p-2 text-gray-700 font-semibold">{product.code}</td>
                          <td className="border-r border-gray-100 p-2 text-gray-700">{product.name}</td>
                          <td className="p-2 text-right text-gray-700 font-semibold">
                            <span className="inline-flex min-w-[60px] items-center justify-end rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              {formatQuantity(product.availableQuantity)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                  {products.map((product, index) => (
                    <div key={product.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow">
                      <div className="flex justify-between">
                        <h3 className="font-bold text-base text-gray-900 flex-1">{product.name}</h3>
                        <span className="text-sm text-gray-600 ml-2">№ {index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>
                      <div>
                        <span className="font-semibold text-gray-700 block">Кількість:</span>
                        <span className="font-bold text-lg text-blue-600">{formatQuantity(product.availableQuantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              selectedGroup && !isLoadingProducts ? (
                <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center text-sm text-gray-500">
                  Для цієї групи товари не знайдені. Спробуйте інший напрям або групу.
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center text-sm text-gray-500">
                  Оберіть фільтри, щоб побачити результати.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}