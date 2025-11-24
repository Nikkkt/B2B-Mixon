import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  fetchAdminProductGroups,
  createAdminProductGroup,
  updateAdminProductGroup,
  deleteAdminProductGroup,
  uploadProductGroupDiscounts,
} from "../api/adminProductGroupsApi";
import { fetchAdminDirections } from "../api/adminDirectionsApi";

const discountTemplateRows = [
  ["101", "5", "7", "10"],
  ["102", "3", "5", "8"],
  ["103", "2", "4", "6"],
  ["200", "1", "2", "4"],
];

const formatPercent = (value) =>
  value === null || value === undefined ? "—" : `${Number(value).toFixed(2)}%`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("uk-UA") : "—";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("uk-UA") : "—";

function DiscountPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
      <FaPercent className="text-gray-400" />
      <span>{label}</span>
      <span className="font-semibold text-gray-900">{formatPercent(value)}</span>
    </span>
  );
}

function GroupFormModal({ state, onClose, onSubmit, directionOptions }) {
  const { isOpen, mode, entity } = state;
  const [localState, setLocalState] = useState({ groupNumber: "", name: "", directionId: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (entity) {
      setLocalState({
        groupNumber: entity.groupNumber,
        name: entity.groupName,
        directionId: entity.directionId,
      });
    } else {
      setLocalState({ groupNumber: "", name: "", directionId: "" });
    }
    setErrors({});
  }, [entity, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field, value) => setLocalState((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!localState.groupNumber.trim()) {
      nextErrors.groupNumber = "Вкажіть номер групи";
    }
    if (!localState.name.trim()) {
      nextErrors.name = "Вкажіть назву групи";
    }
    if (!localState.directionId) {
      nextErrors.directionId = "Оберіть напрямок";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      groupNumber: localState.groupNumber.trim(),
      name: localState.name.trim(),
      directionId: localState.directionId,
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4 py-6 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <header className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">
            {mode === "edit" ? "Редагувати групу" : "Нова група"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Оберіть напрямок, вкажіть назву та номер. Знижки оновлюються через Excel.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Група *</span>
            <select
              value={localState.directionId}
              onChange={(event) => handleChange("directionId", event.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.directionId ? "border-red-400" : "border-gray-200"
              }`}
            >
              <option value="">Оберіть напрямок…</option>
              {directionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.directionId ? (
              <span className="text-xs text-red-500">{errors.directionId}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Назва *</span>
            <input
              value={localState.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="100 - MIXON - CAR REFINISH"
            />
            {errors.name ? <span className="text-xs text-red-500">{errors.name}</span> : null}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Номер *</span>
            <input
              value={localState.groupNumber}
              onChange={(event) => handleChange("groupNumber", event.target.value)}
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.groupNumber ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="100"
              disabled={mode === "edit"}
            />
            {errors.groupNumber ? <span className="text-xs text-red-500">{errors.groupNumber}</span> : null}
          </label>
        </form>

        <footer className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
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

function MobileGroupCard({ group, onEdit, onDelete }) {
  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Номер</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">{group.groupNumber}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              <FaLayerGroup />
              Група
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(group)}
          className="text-sm text-red-500 hover:text-red-600 font-semibold"
        >
          Видалити
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Група</p>
          <p className="text-gray-900 flex items-center gap-2">
            <FaLink className="text-gray-400" />
            {group.directionLabel || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Назва</p>
          <p className="text-gray-900">{group.groupName || "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <DiscountPill label="Малий опт" value={group.smallDiscount} />
        <DiscountPill label="Опт" value={group.wholesaleDiscount} />
        <DiscountPill label="Крупний опт" value={group.largeDiscount} />
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

function DeleteDialog({ state, onCancel, onConfirm }) {
  if (!state.isOpen || !state.target) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4 py-6 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Видалити групу</h3>
        <p className="text-sm text-gray-600">
          Ви впевнені, що хочете видалити <span className="font-semibold text-gray-900">{state.targetLabel}</span>? Цю дію неможливо скасувати.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductGroups() {
  const [groups, setGroups] = useState([]);
  const [directions, setDirections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editorState, setEditorState] = useState({ isOpen: false, mode: "create", entity: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, target: null, targetLabel: "" });
  const [feedback, setFeedback] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const directionOptions = useMemo(
    () =>
      directions.map((direction) => ({
        id: direction.id,
        label: direction.code ? `${direction.code} - ${direction.title}` : direction.title,
        productLine: direction.code || direction.title,
      })),
    [directions]
  );

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setRequestError(null);
      const [groupsResponse, directionsResponse] = await Promise.all([
        fetchAdminProductGroups(),
        fetchAdminDirections(),
      ]);
      setGroups(groupsResponse ?? []);
      setDirections(directionsResponse ?? []);
    } catch (error) {
      setRequestError(error?.response?.data?.error ?? error?.message ?? "Не вдалося завантажити групи");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const normalizedGroups = useMemo(
    () =>
      (groups ?? []).map((group) => ({
        id: group.id,
        groupNumber: group.groupNumber,
        groupName: group.name,
        directionId: group.directionId,
        directionLabel: group.directionCode
          ? `${group.directionCode} - ${group.directionTitle}`
          : group.directionTitle,
        productLine: group.productLine ?? "",
        smallDiscount: group.smallWholesaleDiscount,
        wholesaleDiscount: group.wholesaleDiscount,
        largeDiscount: group.largeWholesaleDiscount,
        addedAt: group.addedAt,
        updatedAt: group.updatedAt,
      })),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return normalizedGroups;
    }
    return normalizedGroups.filter((group) => {
      const haystack = `${group.groupNumber} ${group.groupName ?? ""} ${group.directionLabel ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [normalizedGroups, searchTerm]);

  const openCreateModal = () => setEditorState({ isOpen: true, mode: "create", entity: null });
  const openEditModal = (group) => setEditorState({ isOpen: true, mode: "edit", entity: group });
  const closeModal = () => setEditorState({ isOpen: false, mode: "create", entity: null });

  const openDeleteDialog = (group) =>
    setDeleteDialog({
      isOpen: true,
      target: group,
      targetLabel: `${group.groupNumber} - ${group.groupName ?? "Без назви"}`,
    });
  const closeDeleteDialog = () => setDeleteDialog({ isOpen: false, target: null, targetLabel: "" });

  const handleSaveGroup = async ({ groupNumber, name, directionId }) => {
    try {
      setRequestError(null);
      const directionMeta = directionOptions.find((option) => option.id === directionId);
      const productLine = directionMeta?.productLine ?? directionMeta?.label ?? "";
      if (editorState.mode === "edit" && editorState.entity) {
        const updated = await updateAdminProductGroup(editorState.entity.id, {
          name,
          productLine,
          directionId,
        });
        setGroups((prev) => prev.map((group) => (group.id === updated.id ? updated : group)));
        setFeedback({ type: "success", message: `Групу ${groupNumber} оновлено` });
      } else {
        const created = await createAdminProductGroup({
          groupNumber,
          name,
          productLine,
          directionId,
        });
        setGroups((prev) => [...prev, created]);
        setFeedback({ type: "success", message: `Групу ${groupNumber} створено` });
      }
      closeModal();
    } catch (error) {
      setRequestError(error?.response?.data?.error ?? error?.message ?? "Не вдалося зберегти групу");
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteDialog.target) {
      return;
    }
    try {
      setRequestError(null);
      await deleteAdminProductGroup(deleteDialog.target.id);
      setGroups((prev) => prev.filter((group) => group.id !== deleteDialog.target.id));
      setFeedback({ type: "info", message: `Групу ${deleteDialog.target.groupNumber} видалено` });
    } catch (error) {
      setRequestError(error?.response?.data?.error ?? error?.message ?? "Не вдалося видалити групу");
    } finally {
      closeDeleteDialog();
    }
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setFeedback(null);
    setRequestError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProductGroupDiscounts(formData);
      setFeedback({ type: "success", message: result.message ?? "Знижки оновлено" });
      await loadData();
    } catch (error) {
      setRequestError(error?.response?.data?.error ?? error?.message ?? "Не вдалося завантажити знижки");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <HomeLayout>
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
                  Керуйте переліком груп та стандартних знижок. Спершу додайте групу вручну, потім імпортуйте
                  Excel з трьома типами знижок.
                </p>
              </div>
            </div>
            <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
              <li>Заповніть назву та номер групи, оберіть напрямок.</li>
              <li>Підготуйте Excel з колонками: «Номер групи», «Знижка малий опт», «Знижка опт», «Знижка крупний опт».</li>
              <li>Після імпорту нові групи, яких не було раніше, потрібно заповнити вручну.</li>
            </ol>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow border border-gray-200">
          <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaLayerGroup className="text-indigo-500" />
                Каталог груп
              </h3>
              <p className="text-sm text-gray-600">
                Всього груп: {normalizedGroups.length}. Відображено: {filteredGroups.length}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[240px]">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="search"
                  placeholder="Пошук за номером або назвою"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                <FaPlus /> Додати
              </button>
            </div>
          </header>

          {isLoading ? (
            <div className="px-6 py-10 text-center text-gray-500">Завантаження груп…</div>
          ) : (
            <>
              <div className="px-4 py-4 md:hidden">
                <div className="grid gap-4">
                  {filteredGroups.map((group) => (
                    <MobileGroupCard
                      key={`${group.groupNumber}-mobile`}
                      group={group}
                      onEdit={openEditModal}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                  {filteredGroups.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-6">Немає груп за вашим запитом.</div>
                  )}
                </div>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">№</th>
                      <th className="px-6 py-3 text-left">Група</th>
                      <th className="px-6 py-3 text-left">Назва</th>
                      <th className="px-6 py-3 text-left">Знижки</th>
                      <th className="px-6 py-3 text-left">Додана</th>
                      <th className="px-6 py-3 text-left">Оновлена</th>
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
                        <tr key={group.id} className="hover:bg-indigo-50/40">
                          <td className="px-6 py-3 font-semibold text-gray-900">{group.groupNumber}</td>
                          <td className="px-6 py-3 text-gray-600">{group.directionLabel || "—"}</td>
                          <td className="px-6 py-3 text-gray-900">{group.groupName || "—"}</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-2">
                              <DiscountPill label="Малий опт" value={group.smallDiscount} />
                              <DiscountPill label="Опт" value={group.wholesaleDiscount} />
                              <DiscountPill label="Крупний опт" value={group.largeDiscount} />
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDate(group.addedAt)}</td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(group.updatedAt)}</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(group)}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                              >
                                <FaEdit /> Редагувати
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteDialog(group)}
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
            </>
          )}
        </section>

        <section className="bg-white rounded-xl shadow border border-gray-200">
          <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FaUpload className="text-indigo-500" />
              Завантаження знижок
            </h3>
            <p className="text-sm text-gray-600">
              Завантажте Excel (.xlsx/.xls) з колонками: «Номер групи», «Знижка малий опт», «Знижка опт», «Знижка крупний опт».
            </p>
          </header>
          <div className="px-4 md:px-6 py-6 space-y-4">
            {feedback ? (
              <div
                className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : feedback.type === "info"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                }`}
              >
                <FaFileExcel />
                <span>{feedback.message}</span>
              </div>
            ) : null}

            <div className="border border-yellow-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900">Приклад таблиці для імпорту</p>
                <p className="text-xs text-yellow-800/80">
                  Створіть файл з такими колонками, як на сторінці «Загрузка товаров». Будь-які зайві стовпці видаліть перед завантаженням.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-yellow-200 text-yellow-900">
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Номер групи</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Знижка малий опт</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Знижка опт</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Знижка крупний опт</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountTemplateRows.map((row, idx) => (
                      <tr key={`discount-template-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-yellow-50"}>
                        {row.map((cell, cellIdx) => (
                          <td
                            key={`${idx}-${cellIdx}`}
                            className="px-3 py-2 border-t border-yellow-100 text-gray-700 text-center"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
              <FaFileExcel className="text-4xl text-green-600" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Виберіть Excel файл</p>
                <p className="text-xs text-gray-500">Перший рядок — заголовки</p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                disabled={isUploading}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
                <FaUpload /> {isUploading ? "Завантаження…" : "Завантажити"}
              </span>
            </label>
          </div>
        </section>

        {requestError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{requestError}</div>
        ) : null}

        <GroupFormModal
          state={editorState}
          onClose={closeModal}
          onSubmit={({ groupNumber, name, directionId }) =>
            handleSaveGroup({ groupNumber, name, directionId })
          }
          directionOptions={directionOptions}
        />
        <DeleteDialog state={deleteDialog} onCancel={closeDeleteDialog} onConfirm={handleDeleteGroup} />
      </div>
    </HomeLayout>
  );
}
