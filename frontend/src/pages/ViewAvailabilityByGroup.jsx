import { useEffect, useMemo, useState } from "react";
import HomeLayout from "../components/HomeLayout";
import Select from "react-select";
import { FaFilePdf, FaFileExcel, FaLayerGroup, FaClipboardList, FaProjectDiagram, FaWarehouse } from "react-icons/fa";
import {
  fetchAllAvailabilityDirections,
  fetchAvailabilityGroups,
  fetchGroupAvailabilityTable,
  downloadGroupAvailabilityExcel,
  downloadGroupAvailabilityPdf
} from "../api/availabilityApi";
import { pickReadableValue } from "../utils/displayName";
import { sortGroupsByNumber } from "../utils/productGroups";

const customSelectStyles = {
  container: (provided) => ({
    ...provided,
    width: "100%",
    minWidth: 0
  }),
  control: (provided, state) => ({
    ...provided,
    minHeight: "46px",
    minWidth: 0,
    width: "100%",
    borderRadius: "0.85rem",
    border: state.isFocused ? "2px solid rgb(59 130 246)" : "1px solid rgba(59, 130, 246, 0.35)",
    background: "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(219,234,254,0.8))",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.25)" : "0 1px 4px rgba(15, 23, 42, 0.06)",
    paddingLeft: "0.35rem",
    transition: "all 150ms ease",
    "&:hover": {
      borderColor: "rgba(59,130,246,0.7)"
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0.25rem 0.75rem",
    minWidth: 0,
    overflow: "hidden",
    flexWrap: "nowrap"
  }),
  input: (provided) => ({
    ...provided,
    color: "rgb(37, 99, 235)"
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "rgba(37, 99, 235, 0.7)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: "0.7rem"
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "rgb(15, 23, 42)",
    fontWeight: 600,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
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

const formatQuantity = (value) => Number(value ?? 0).toLocaleString("uk-UA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const getDirectionLabel = (direction, fallback = "—") =>
  pickReadableValue([direction?.displayName, direction?.name, direction?.code], fallback);
const getBranchLabel = (branch, fallback = "—") =>
  pickReadableValue([branch?.displayName, branch?.name, branch?.code], fallback);
const normalizeId = (value) => (value ?? "").toString().trim().toLowerCase();

export default function ViewAvailabilityByGroup() {
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [table, setTable] = useState(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const directionOptions = useMemo(() => directions.map(direction => ({
    value: direction.id,
    label: getDirectionLabel(direction)
  })), [directions]);

  const groupOptions = useMemo(() => groups.map(group => ({
    value: group.id,
    label: group.name || group.groupNumber || "—"
  })), [groups]);

  const branches = table?.branches ?? [];
  const products = table?.products ?? [];
  const lastUpdatedLabel = table?.lastUpdatedAt
    ? new Date(table.lastUpdatedAt).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })
    : "";

  useEffect(() => {
    let isMounted = true;
    setIsLoadingDirections(true);
    setErrorMessage("");

    fetchAllAvailabilityDirections()
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
        setErrorMessage(error?.message || "Не вдалося завантажити напрями.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDirections(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDirection) {
      setGroups([]);
      setSelectedGroup(null);
      setTable(null);
      return;
    }

    let isMounted = true;
    setIsLoadingGroups(true);
    setGroups([]);
    setSelectedGroup(null);
    setTable(null);
    setErrorMessage("");

    fetchAvailabilityGroups(selectedDirection)
      .then(data => {
        if (!isMounted) {
          return;
        }
        const sortedGroups = sortGroupsByNumber(Array.isArray(data) ? data : []);
        setGroups(sortedGroups);
      })
      .catch(error => {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error?.message || "Не вдалося завантажити групи товарів.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingGroups(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDirection]);

  useEffect(() => {
    if (!selectedGroup) {
      setTable(null);
      return;
    }

    let isMounted = true;
    setIsLoadingTable(true);
    setTable(null);
    setErrorMessage("");

    fetchGroupAvailabilityTable(selectedGroup)
      .then(data => {
        if (!isMounted) {
          return;
        }
        setTable(data ?? null);
      })
      .catch(error => {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error?.message || "Не вдалося завантажити таблицю наявності.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGroup]);

  const handleDirectionChange = (option) => {
    setSelectedDirection(option ? option.value : null);
  };

  const handleGroupChange = (option) => {
    setSelectedGroup(option ? option.value : null);
  };

  const handleDownload = async (format) => {
    if (!selectedGroup) {
      return;
    }

    try {
      setExportingFormat(format);
      const response = format === "excel"
        ? await downloadGroupAvailabilityExcel(selectedGroup)
        : await downloadGroupAvailabilityPdf(selectedGroup);

      const contentDisposition = response.headers?.["content-disposition"];
      const fileNameMatch = contentDisposition
        ? contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
        : null;
      const rawFileName = fileNameMatch?.[1] || fileNameMatch?.[2];
      let fileName = rawFileName || (format === "excel" ? "group-availability.xlsx" : "group-availability.pdf");
      try {
        fileName = decodeURIComponent(fileName);
      } catch (error) {
        // ignore decode errors
      }

      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"]
          || (format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf")
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch (error) {
      setErrorMessage(error?.message || "Не вдалося завантажити файл.");
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExcelExport = () => handleDownload("excel");
  const handlePdfExport = () => handleDownload("pdf");

  const selectedDirectionLabel = directionOptions.find(option => option.value === selectedDirection)?.label || "Не обрано";
  const selectedGroupLabel = groupOptions.find(option => option.value === selectedGroup)?.label || "Не обрано";

  return (
    <HomeLayout>
      <div className="flex-1 min-w-0 flex flex-col bg-white p-4 md:p-6 rounded-lg shadow-lg border border-gray-100">
        <nav className="text-sm text-blue-700/70 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex gap-2 flex-wrap">
            <li className="flex items-center gap-2">
              <a href="/home" className="text-blue-600 hover:underline">Головна</a>
              <span>/</span>
            </li>
            <li className="text-blue-900 font-semibold">Перегляд наявності за групами</li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Перегляд за групами</h2>
          {products.length > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold text-blue-700 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              {products.length} позицій
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[3fr_2fr] mb-8">
          <div className="min-w-0 max-w-full rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-blue-50 p-5 shadow-inner">
            <div className="mb-5 flex items-center gap-3 text-blue-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FaClipboardList />
              </span>
              <div>
                <p className="text-base font-semibold">Крок 1 — оберіть фільтри</p>
                <p className="text-xs text-blue-700/80">Вкажіть напрям та групу — ми покажемо відповідні залишки.</p>
              </div>
            </div>

            <form className="space-y-4 min-w-0">
              <div>
                <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-2">Товарне направлення *</label>
                <Select
                  id="direction"
                  styles={customSelectStyles}
                  options={directionOptions}
                  isClearable
                  isSearchable
                  placeholder={isLoadingDirections ? "Завантаження направлень..." : "-- Оберіть направлення --"}
                  onChange={handleDirectionChange}
                  value={directionOptions.find(option => option.value === selectedDirection) ?? null}
                  isDisabled={isLoadingDirections}
                  isLoading={isLoadingDirections}
                />
              </div>

              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">Група товарів *</label>
                <Select
                  id="group"
                  styles={customSelectStyles}
                  options={groupOptions}
                  isClearable
                  isSearchable
                  placeholder={isLoadingGroups ? "Завантаження груп..." : (selectedDirection ? "-- Оберіть групу --" : "-- Спочатку оберіть направлення --")}
                  onChange={handleGroupChange}
                  value={groupOptions.find(option => option.value === selectedGroup) ?? null}
                  isDisabled={!selectedDirection || isLoadingGroups}
                  isLoading={isLoadingGroups}
                />
              </div>
            </form>
          </div>

          <div className="min-w-0 max-w-full rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-inner flex flex-col gap-4 space-y-2">
            <div className="flex items-center gap-3 text-emerald-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <FaProjectDiagram />
              </span>
              <div>
                <p className="text-base font-semibold">Крок 2 — перевірте вибір</p>
                <p className="text-xs text-emerald-700/80">Миттєво отримайте деталі вибраних напрямів та груп.</p>
              </div>
            </div>
            
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FaWarehouse />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">Направлення</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{directionOptions.find(opt => opt.value === selectedDirection)?.label || "Не обрано"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FaLayerGroup />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">Група</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{groupOptions.find(opt => opt.value === selectedGroup)?.label || "Не обрано"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 min-w-0 min-h-0 bg-white/90 rounded-3xl border border-gray-100 shadow-inner p-5">
          {isLoadingTable ? (
            <p className="text-center text-gray-500">Завантаження товарів...</p>
          ) : products.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex gap-2">
                  <button onClick={handleExcelExport} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-emerald-100">
                    <FaFileExcel /> Excel
                  </button>
                  <button onClick={handlePdfExport} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow hover:bg-red-100">
                    <FaFilePdf /> PDF
                  </button>
                </div>
                <span className="text-xs text-gray-400">Показано філіалів: {branches.length}</span>
              </div>

              <div className="hidden md:block max-w-full overflow-x-auto overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow">
                <table className="w-full text-sm align-middle min-w-[1400px]">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="sticky top-0 border-b border-r border-gray-100 p-3 text-left text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">№</th>
                      <th className="sticky top-0 border-b border-r border-gray-100 p-3 text-left text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase min-w-[10rem]">Код</th>
                      <th className="sticky top-0 border-b border-r border-gray-100 p-3 text-left text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase min-w-[18rem]">Назва</th>
                      <th className="sticky top-0 border-b border-r border-gray-100 p-3 text-right text-[11px] font-semibold tracking-[0.08em] text-gray-600 uppercase">Загалом</th>
                      {branches.map(branch => {
                        const branchKey = normalizeId(branch.id ?? branch.Id ?? branch.departmentId ?? branch.DepartmentId ?? branch.branchId ?? branch.BranchId);
                        return (
                          <th key={branchKey} className="sticky top-0 border-b border-r border-gray-100 p-3 text-right text-[11px] font-semibold tracking-[0.05em] text-gray-600 uppercase whitespace-nowrap last:border-r-0">
                            <span className="block text-[10px] text-gray-400">Філіал</span>
                            {getBranchLabel(branch)}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const branchQuantities = product.branches ?? product.Branches ?? [];
                      const quantityMap = new Map((branchQuantities ?? []).map(item => [
                        normalizeId(item.departmentId ?? item.DepartmentId ?? item.branchId ?? item.BranchId ?? item.id ?? item.Id),
                        item.quantity ?? item.Quantity ?? 0
                      ]));
                      return (
                        <tr key={product.id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/80"} border-b border-gray-100 transition hover:bg-blue-50/60`}>
                          <td className="border-r border-gray-100 p-3 text-gray-600 font-semibold">{index + 1}</td>
                          <td className="border-r border-gray-100 p-3 font-semibold text-gray-900 tracking-wide min-w-[10rem]">{product.code}</td>
                          <td className="border-r border-gray-100 p-3 text-gray-700 font-medium min-w-[18rem]">{product.name}</td>
                          <td className="border-r border-gray-100 p-3 text-right text-gray-900 font-bold">
                            <span className="inline-flex items-center justify-end gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              <span className="h-2 w-2 rounded-full bg-blue-300"></span>
                              {formatQuantity(product.totalQuantity)}
                            </span>
                          </td>
                          {branches.map(branch => {
                            const branchKey = normalizeId(branch.id ?? branch.Id ?? branch.departmentId ?? branch.DepartmentId ?? branch.branchId ?? branch.BranchId);
                            const branchQty = quantityMap.get(branchKey) ?? 0;
                            const isZero = Number(branchQty ?? 0) === 0;
                            return (
                              <td key={branchKey} className="p-3 text-right border-r border-gray-100 last:border-r-0">
                                <span className={`inline-flex items-center justify-end gap-2 rounded-full border px-2 py-0.5 text-xs font-semibold ${isZero ? "border-gray-100 text-gray-400" : "border-blue-100 text-blue-800"}`}>
                                  {formatQuantity(branchQty)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4 overflow-y-auto">
                {products.map((product, index) => {
                  const branchQuantities = product.branches ?? product.Branches ?? [];
                  const quantityMap = new Map((branchQuantities ?? []).map(item => [
                    normalizeId(item.departmentId ?? item.DepartmentId ?? item.branchId ?? item.BranchId ?? item.id ?? item.Id),
                    item.quantity ?? item.Quantity ?? 0
                  ]));
                  return (
                    <div key={product.id} className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Товар</span>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        </div>
                        <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold">№ {index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-500">Код: <span className="font-semibold text-gray-900">{product.code}</span></p>
                      <div>
                        <span className="text-xs uppercase tracking-wide text-gray-400">Загальна кількість</span>
                        <p className="text-2xl font-bold text-gray-900">{formatQuantity(product.totalQuantity)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {branches.map(branch => {
                          const branchKey = normalizeId(branch.id ?? branch.Id ?? branch.departmentId ?? branch.DepartmentId ?? branch.branchId ?? branch.BranchId);
                          const branchQty = quantityMap.get(branchKey) ?? 0;
                          return (
                            <div key={branchKey} className="rounded-xl border border-gray-100 bg-white px-3 py-2">
                              <p className="text-xs font-medium text-gray-900 break-words">{getBranchLabel(branch)}</p>
                              <p className={`text-base font-semibold ${branchQty ? "text-gray-900" : "text-gray-400"}`}>{formatQuantity(branchQty)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            selectedGroup && !isLoadingTable ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center text-sm text-gray-500">
                Для цієї групи товари не знайдені.
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center text-sm text-gray-500">
                Оберіть фільтри, щоб побачити результати.
              </div>
            )
          )}
        </section>
      </div>
    </HomeLayout>
  );
}