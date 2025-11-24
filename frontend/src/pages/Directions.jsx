import { useState, useMemo, useEffect, useCallback } from "react";
import HomeLayout from "../components/HomeLayout";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import {
  fetchAdminDirections,
  createAdminDirection,
  updateAdminDirection,
  deleteAdminDirection,
} from "../api/adminDirectionsApi";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Directions() {
  const [directions, setDirections] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({ title: "" });
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, targetId: null, targetTitle: "" });

  const orderedDirections = useMemo(
    () =>
      [...directions].sort((a, b) => {
        const orderA = Number.isFinite(a?.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
        const orderB = Number.isFinite(b?.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        const titleA = a?.title ?? "";
        const titleB = b?.title ?? "";
        return titleA.localeCompare(titleB, "uk", { numeric: true, sensitivity: "base" });
      }),
    [directions]
  );

  const loadDirections = useCallback(async () => {
    try {
      setIsLoading(true);
      setRequestError("");
      const data = await fetchAdminDirections();
      setDirections(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setRequestError(loadError.message ?? "Не вдалося завантажити напрямки.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirections();
  }, [loadDirections]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormValues({ title: "" });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (direction) => {
    setEditingId(direction.id);
    setFormValues({ title: direction.title });
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormValues({ title: "" });
    setFormError("");
  };

  const handleInputChange = (event) => {
    setFormValues({ title: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedTitle = formValues.title.trim();

    if (!trimmedTitle) {
      setFormError("Назва обов'язкова.");
      return;
    }

    try {
      setRequestError("");

      if (editingId) {
        const updated = await updateAdminDirection(editingId, { title: trimmedTitle });
        setDirections((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createAdminDirection({ title: trimmedTitle });
        setDirections((prev) => [...prev, created]);
      }

      closeForm();
    } catch (submitError) {
      setRequestError(submitError.message ?? "Не вдалося зберегти направлення.");
    }
  };

  const openDeleteDialog = (direction) => {
    setDeleteDialog({ isOpen: true, targetId: direction.id, targetTitle: direction.title ?? "" });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, targetId: null, targetTitle: "" });
  };

  const handleDelete = async () => {
    const { targetId } = deleteDialog;
    if (!targetId) {
      return;
    }

    try {
      setRequestError("");
      await deleteAdminDirection(targetId);
      setDirections((prev) => prev.filter((item) => item.id !== targetId));
    } catch (deleteError) {
      setRequestError(deleteError.message ?? "Не вдалося видалити направлення.");
    } finally {
      closeDeleteDialog();
    }
  };

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-xl shadow border border-gray-200 space-y-6">
        <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="inline-flex items-center gap-2">
            <li>
              <a href="/home" className="text-blue-600 hover:underline">
                Головна
              </a>
            </li>
            <li>/</li>
            <li className="text-gray-700">Направлення</li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Направлення</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Тут можна додавати та редагувати товарні напрямки, які використовуються
              для групування асортименту. Сформуйте список вручну, щоб згодом
              прив'язувати до них групи товарів.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow"
          >
            <FaPlus />
            Додати
          </button>
        </div>

        {requestError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {requestError}
          </div>
        ) : null}

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12">№</th>
                <th className="px-4 py-3">Назва</th>
                <th className="px-4 py-3 whitespace-nowrap">Додана</th>
                <th className="px-4 py-3 whitespace-nowrap">Оновлена</th>
                <th className="px-4 py-3 text-center">Дії</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Завантаження направлень…
                  </td>
                </tr>
              ) : orderedDirections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Направлення ще не створені.
                  </td>
                </tr>
              ) : (
                orderedDirections.map((direction, index) => (
                  <tr
                    key={direction.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-gray-700 font-medium">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">
                      {direction.code ? (
                        <span className="block text-xs text-gray-500">{direction.code}</span>
                      ) : null}
                      <span>{direction.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(direction.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(direction.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditForm(direction)}
                          className="text-blue-600 hover:text-blue-700"
                          aria-label="Редагувати направлення"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(direction)}
                          className="text-red-500 hover:text-red-600"
                          aria-label="Видалити направлення"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              Завантаження направлень…
            </div>
          ) : orderedDirections.length === 0 ? (
            <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              Направлення ще не створені.
            </div>
          ) : (
            orderedDirections.map((direction, index) => (
              <div key={direction.id} className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center justify-center text-xs font-semibold text-white bg-blue-600 rounded-full w-6 h-6">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditForm(direction)}
                      className="text-blue-600 hover:text-blue-700"
                      aria-label="Редагувати направлення"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteDialog(direction)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="Видалити направлення"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div>
                  {direction.code ? (
                    <p className="text-xs text-gray-500">{direction.code}</p>
                  ) : null}
                  <h3 className="text-base font-semibold text-gray-900">
                    {direction.title}
                  </h3>
                </div>
                <dl className="text-sm text-gray-600 grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Додана</dt>
                    <dd>{formatDateTime(direction.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Оновлена</dt>
                    <dd>{formatDateTime(direction.updatedAt)}</dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-gray-900/60 px-4 py-6 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative">
            <button
              type="button"
              onClick={closeForm}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Закрити форму"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? "Редагувати направлення" : "Нове направлення"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="directionTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Назва*
                </label>
                <input
                  id="directionTitle"
                  type="text"
                  value={formValues.title}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Наприклад: 08 - Color Tools - професійні матеріали"
                  autoFocus
                />
                {formError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {formError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDialog.isOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center px-4 py-6 bg-gray-900/70">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Видалити направлення</h3>
            <p className="text-sm text-gray-600">
              Ви впевнені, що хочете видалити напрямок
              <span className="font-semibold text-gray-900"> “{deleteDialog.targetTitle}”</span>? Цю дію
              неможливо скасувати.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </HomeLayout>
  );
}
