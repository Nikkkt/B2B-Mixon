import { useEffect, useMemo, useState } from "react";
import HomeLayout from "../components/HomeLayout";
import {
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUpload,
  FaFileExcel,
  FaPercent,
  FaLink,
  FaClock,
} from "react-icons/fa";
import { read, utils } from "xlsx";

const initialGroups = [
  {
    groupNumber: "100",
    productLine: "100",
    groupName: "MIXON - CAR REFINISH",
    discounts: {
      smallWholesale: 10,
      wholesale: 25,
      largeWholesale: 32.5,
    },
    addedAt: "2021-08-27T04:36:00Z",
    updatedAt: "2023-02-10T09:50:00Z",
  },
  {
    groupNumber: "101",
    productLine: "101",
    groupName: "MIXON - Автоэмаль SYNTHETIC",
    discounts: {
      smallWholesale: 10,
      wholesale: 25,
      largeWholesale: 32.5,
    },
    addedAt: "2021-08-27T04:36:00Z",
    updatedAt: "2023-02-10T09:50:00Z",
  },
  {
    groupNumber: "102",
    productLine: "102",
    groupName: "MIXON - Автоэмаль ACRYL",
    discounts: {
      smallWholesale: 12,
      wholesale: 27,
      largeWholesale: 35,
    },
    addedAt: "2021-08-27T04:36:00Z",
    updatedAt: "2023-02-10T09:50:00Z",
  },
  {
    groupNumber: "103",
    productLine: "103",
    groupName: "MIXON - Автоэмаль METALLIC",
    discounts: {
      smallWholesale: 7,
      wholesale: 20,
      largeWholesale: 30,
    },
    addedAt: "2021-08-27T04:36:00Z",
    updatedAt: "2023-02-10T09:50:00Z",
  },
  {
    groupNumber: "104",
    productLine: "104",
    groupName: "MIXON - Аерозоли в аерозольних балончиках",
    discounts: {
      smallWholesale: 10,
      wholesale: 23,
      largeWholesale: 30.7,
    },
    addedAt: "2021-08-27T04:36:00Z",
    updatedAt: "2023-02-10T09:50:00Z",
  },
  {
    groupNumber: "695",
    productLine: "6",
    groupName: "SMIRDEX - Абразивна бумага - Розпродажа",
    discounts: {
      smallWholesale: 0,
      wholesale: 0,
      largeWholesale: 0,
    },
    addedAt: "2021-08-27T04:37:00Z",
    updatedAt: "2023-02-10T09:50:00Z",
  },
];

const groupNumberHeaders = [
  "№ Группы",
  "Номер группы",
  "Номер",
  "Group Number",
  "GroupNumber",
];

const smallWholesaleHeaders = [
  "Скидка Мелкий Опт",
  "Скидка Мелк. Опт",
  "Small Wholesale",
  "Discount Small",
];

const wholesaleHeaders = [
  "Скидка Опт",
  "Wholesale Discount",
  "Discount Wholesale",
];

const largeWholesaleHeaders = [
  "Скидка Крупный Опт",
  "Large Wholesale",
  "Discount Large",
];

function getValueFromRow(row, candidates) {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const value = row[key];
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
  }
  return "";
}

function parsePercent(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value)
    .replace(/%/g, "")
    .replace(/,/g, ".")
    .trim();
  const numeric = Number.parseFloat(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${value.toFixed(2)}%`;
}

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("uk-UA");
}

function formatDateTime(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("uk-UA");
}

function GroupFormModal({ state, onClose, onSubmit }) {
  const { isOpen, mode, entity } = state;
  const [localState, setLocalState] = useState({
    groupNumber: "",
    productLine: "",
    groupName: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (entity) {
      setLocalState({
        groupNumber: entity.groupNumber,
        productLine: entity.productLine,
        groupName: entity.groupName,
      });
    } else {
      setLocalState({ groupNumber: "", productLine: "", groupName: "" });
    }
    setErrors({});
  }, [entity, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field, value) => {
    setLocalState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!localState.groupNumber.trim()) {
      nextErrors.groupNumber = "Вкажіть номер групи";
    }
    if (!localState.productLine.trim()) {
      nextErrors.productLine = "Вкажіть прив'язку до лінійки";
    }
    if (!localState.groupName.trim()) {
      nextErrors.groupName = "Вкажіть назву групи";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      groupNumber: localState.groupNumber.trim(),
      productLine: localState.productLine.trim(),
      groupName: localState.groupName.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="relative w-full max-w-xl h-full md:h-auto md:max-h-[90vh] bg-white shadow-2xl overflow-y-auto">
        <header className="px-6 py-4 border-b border-gray-100">
          <nav className="text-xs text-gray-500 space-x-1">
            <span>Головна</span>
            <span>/</span>
            <span>Групи товарів</span>
            <span>/</span>
            <span className="text-indigo-600 font-medium">
              {mode === "edit" ? "Редагувати групу" : "Додати групу"}
            </span>
          </nav>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <FaLayerGroup />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {mode === "edit" ? "Редагувати групу" : "Нова група"}
              </h3>
              <p className="text-sm text-gray-500">
                Заповніть номер групи, прив'язку до лінійки та назву. Знижки буде
                оновлено під час імпорту Excel файлу.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Номер групи *</span>
            <input
              value={localState.groupNumber}
              onChange={(event) => handleChange("groupNumber", event.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.groupNumber ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="Наприклад, 100"
              disabled={mode === "edit"}
            />
            {errors.groupNumber ? (
              <span className="text-xs text-red-500">{errors.groupNumber}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Прив'язка до лінії *</span>
            <input
              value={localState.productLine}
              onChange={(event) => handleChange("productLine", event.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.productLine ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="Наприклад, 100"
            />
            {errors.productLine ? (
              <span className="text-xs text-red-500">{errors.productLine}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Назва групи *</span>
            <input
              value={localState.groupName}
              onChange={(event) => handleChange("groupName", event.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.groupName ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="Наприклад, MIXON - CAR REFINISH"
            />
            {errors.groupName ? (
              <span className="text-xs text-red-500">{errors.groupName}</span>
            ) : null}
          </label>
        </form>

        <footer className="px-6 py-4 border-t border-gray-100 flex justify-between md:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Зберегти
          </button>
        </footer>
      </div>
    </div>
  );
}

function DiscountPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
      <FaPercent className="text-gray-400" />
      <span>{label}</span>
      <span className="font-semibold text-gray-900">{formatPercent(value)}</span>
    </span>
  );
}

function MobileGroupCard({ group, onEdit, onDelete }) {
  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Номер групи</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">{group.groupNumber}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              <FaLayerGroup />
              Група
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(group.groupNumber)}
          className="text-sm text-red-500 hover:text-red-600 font-semibold"
        >
          Видалити
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Прив'язка</p>
          <p className="text-gray-900 flex items-center gap-2">
            <FaLink className="text-gray-400" />
            {group.productLine || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Назва</p>
          <p className="text-gray-900">{group.groupName || "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <DiscountPill label="Малий опт" value={group.discounts.smallWholesale} />
        <DiscountPill label="Опт" value={group.discounts.wholesale} />
        <DiscountPill label="Крупний опт" value={group.discounts.largeWholesale} />
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p className="flex items-center gap-1">
          <FaClock /> Додано: {formatDate(group.addedAt)}
        </p>
        <p className="flex items-center gap-1">
          <FaClock /> Оновлено: {formatDateTime(group.updatedAt)}
        </p>
      </div>

      <button
        onClick={() => onEdit(group)}
        className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-100 rounded-lg py-2"
      >
        Редагувати
      </button>
    </article>
  );
}

export default function ProductGroups() {
  const [groups, setGroups] = useState(initialGroups);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState({ isOpen: false, mode: "create", entity: null });
  const [feedback, setFeedback] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) {
      return groups;
    }
    const lower = searchTerm.trim().toLowerCase();
    return groups.filter((group) => {
      return (
        group.groupNumber.toLowerCase().includes(lower) ||
        group.productLine.toLowerCase().includes(lower) ||
        group.groupName.toLowerCase().includes(lower)
      );
    });
  }, [groups, searchTerm]);

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", entity: null });
  };

  const openEditModal = (group) => {
    setModalState({ isOpen: true, mode: "edit", entity: group });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: "create", entity: null });
  };

  const handleSaveGroup = ({ groupNumber, productLine, groupName }) => {
    const now = new Date().toISOString();

    setGroups((prev) => {
      const exists = prev.some((group) => group.groupNumber === groupNumber);
      if (exists) {
        return prev
          .map((group) =>
            group.groupNumber === groupNumber
              ? {
                  ...group,
                  productLine,
                  groupName,
                  updatedAt: now,
                }
              : group
          )
          .sort((a, b) =>
            a.groupNumber.localeCompare(b.groupNumber, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          );
      }

      return [
        ...prev,
        {
          groupNumber,
          productLine,
          groupName,
          discounts: {
            smallWholesale: null,
            wholesale: null,
            largeWholesale: null,
          },
          addedAt: now,
          updatedAt: now,
        },
      ].sort((a, b) =>
        a.groupNumber.localeCompare(b.groupNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    });

    setFeedback({
      type: "success",
      message:
        modalState.mode === "edit"
          ? `Групу ${groupNumber} оновлено`
          : `Групу ${groupNumber} створено. Завантажте Excel, щоб додати знижки`,
    });

    closeModal();
  };

  const handleDeleteGroup = (groupNumber) => {
    const confirmed = window.confirm(`Видалити групу ${groupNumber}?`);
    if (!confirmed) return;

    setGroups((prev) => prev.filter((group) => group.groupNumber !== groupNumber));
    setFeedback({ type: "info", message: `Групу ${groupNumber} видалено` });
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("Не вдалося знайти аркуш у файлі");
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rows = utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) {
        throw new Error("Файл порожній або не містить даних");
      }

      const updates = rows
        .map((row) => {
          const groupNumberRaw = getValueFromRow(row, groupNumberHeaders);
          const groupNumber = groupNumberRaw ? String(groupNumberRaw).trim() : "";
          if (!groupNumber) {
            return null;
          }

          const discountSmall = parsePercent(getValueFromRow(row, smallWholesaleHeaders));
          const discountWholesale = parsePercent(getValueFromRow(row, wholesaleHeaders));
          const discountLarge = parsePercent(getValueFromRow(row, largeWholesaleHeaders));

          return {
            groupNumber,
            discounts: {
              smallWholesale: discountSmall,
              wholesale: discountWholesale,
              largeWholesale: discountLarge,
            },
          };
        })
        .filter(Boolean);

      if (!updates.length) {
        throw new Error("Не знайдено жодного номеру групи у файлі");
      }

      const updatesMap = new Map(updates.map((item) => [item.groupNumber, item.discounts]));
      let updatedCount = 0;
      let createdCount = 0;
      const now = new Date().toISOString();

      setGroups((prev) => {
        const prevMap = new Map(prev.map((group) => [group.groupNumber, group]));
        const next = prev.map((group) => {
          const discounts = updatesMap.get(group.groupNumber);
          if (!discounts) {
            return group;
          }
          updatedCount += 1;
          return {
            ...group,
            discounts: {
              smallWholesale: discounts.smallWholesale ?? group.discounts.smallWholesale,
              wholesale: discounts.wholesale ?? group.discounts.wholesale,
              largeWholesale: discounts.largeWholesale ?? group.discounts.largeWholesale,
            },
            updatedAt: now,
          };
        });

        updatesMap.forEach((discounts, groupNumber) => {
          if (!prevMap.has(groupNumber)) {
            createdCount += 1;
            next.push({
              groupNumber,
              productLine: "",
              groupName: "",
              discounts,
              addedAt: now,
              updatedAt: now,
            });
          }
        });

        next.sort((a, b) =>
          a.groupNumber.localeCompare(b.groupNumber, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );

        return next;
      });

      setFeedback({
        type: "success",
        message: `Оновлено ${updatedCount} груп, створено ${createdCount}`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Не вдалося обробити файл",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <HomeLayout
      children={
        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <FaLayerGroup />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Групи товарів</h2>
                  <p className="text-sm text-gray-600 max-w-3xl">
                    Керуйте переліком груп товарів та стандартними знижками. Додавайте нові групи один раз, а
                    знижки оновлюйте шляхом імпорту Excel файлу, що містить номер групи та три види знижок.
                  </p>
                </div>
              </div>
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                <li>
                  Додайте або оновіть метадані групи: номер, прив'язку до лінійки та назву. Ці дані вводяться вручну.
                </li>
                <li>
                  Підготуйте Excel файл у форматі, як на прикладі, та завантажте його, щоб заповнити знижки «Малий опт»,
                  «Опт» та «Крупний опт». Очікується один рядок на кожну групу.
                </li>
                <li>
                  При додаванні нових груп через Excel вони з'являться зі статусом порожніх назв — заповніть їх вручну.
                </li>
              </ol>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200">
            <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaLayerGroup className="text-indigo-500" />
                  Каталог груп
                </h3>
                <p className="text-sm text-gray-600">
                  Всього груп: {groups.length}. Відображено: {filteredGroups.length}.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    type="search"
                    placeholder="Пошук за номером, лінійкою або назвою"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  <FaPlus /> Додати групу
                </button>
              </div>
            </header>

            <div className="px-4 py-4 md:hidden">
              <div className="grid gap-4">
                {filteredGroups.map((group) => (
                  <MobileGroupCard
                    key={`${group.groupNumber}-mobile`}
                    group={group}
                    onEdit={openEditModal}
                    onDelete={handleDeleteGroup}
                  />
                ))}
                {filteredGroups.length === 0 && (
                  <div className="text-center text-sm text-gray-500 py-6">
                    Немає груп за вашим запитом.
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Номер</th>
                    <th className="px-6 py-3 text-left">Прив'язка</th>
                    <th className="px-6 py-3 text-left">Назва</th>
                    <th className="px-6 py-3 text-left">Знижки</th>
                    <th className="px-6 py-3 text-left">Додано</th>
                    <th className="px-6 py-3 text-left">Оновлено</th>
                    <th className="px-6 py-3 text-left">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                        Немає груп за вашим запитом.
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((group) => (
                      <tr key={group.groupNumber} className="hover:bg-indigo-50/40">
                        <td className="px-6 py-3 font-semibold text-gray-900">{group.groupNumber}</td>
                        <td className="px-6 py-3 text-gray-600">{group.productLine || "—"}</td>
                        <td className="px-6 py-3 text-gray-600">{group.groupName || "—"}</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            <DiscountPill label="Малий опт" value={group.discounts.smallWholesale} />
                            <DiscountPill label="Опт" value={group.discounts.wholesale} />
                            <DiscountPill label="Крупний опт" value={group.discounts.largeWholesale} />
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDate(group.addedAt)}</td>
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(group.updatedAt)}</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditModal(group)}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              <FaEdit /> Редагувати
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.groupNumber)}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-600"
                            >
                              <FaTrash /> Видалити
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200">
            <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaUpload className="text-indigo-500" />
                Завантаження знижок
              </h3>
              <p className="text-sm text-gray-600">
                Завантажте Excel (.xlsx/.xls) із колонками: «№ Группы», «Скидка Мелкий Опт», «Скидка Опт», «Скидка Крупный Опт».
                Дані з інших аркушів ігноруються. Значення знижок перезаписують існуючі поля.
              </p>
            </header>
            <div className="px-4 md:px-6 py-6 space-y-4">
              {feedback ? (
                <div
                  className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    feedback.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : feedback.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  <FaFileExcel />
                  <span>{feedback.message}</span>
                </div>
              ) : null}

              <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                <FaFileExcel className="text-4xl text-green-600" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">Виберіть Excel файл</p>
                  <p className="text-xs text-gray-500">.xlsx або .xls, перший рядок — назви колонок</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
                  <FaUpload /> {isUploading ? "Завантаження..." : "Завантажити"}
                </span>
              </label>
            </div>
          </section>

          <GroupFormModal state={modalState} onClose={closeModal} onSubmit={handleSaveGroup} />
        </div>
      }
    />
  );
}
