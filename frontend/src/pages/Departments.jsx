import { useCallback, useEffect, useMemo, useState } from "react";
import HomeLayout from "../components/HomeLayout";
import {
  FaBuilding,
  FaStore,
  FaUserTie,
  FaClipboardList,
  FaMapMarkerAlt,
  FaEdit,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import {
  fetchAdminDepartmentsDashboard,
  updateAdminDepartment,
  createAdminDepartment,
  deleteAdminDepartment,
} from "../api/adminDepartmentsApi";
import { fetchAdminUsersDashboard } from "../api/adminUsersApi";

const typeOptions = [
  { key: "branch", label: "Філіал" },
  { key: "store", label: "Магазин" },
  { key: "sales", label: "Відділ продажу" },
];

const generateLocalId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const SECTION_TYPE_MAP = {
  branches: "branch",
  stores: "store",
  sales: "sales",
};

const normalizeDepartment = (department) => {
  const typeKey = department.type ?? "branch";
  const typeLabel =
    department.typeLabel ?? typeOptions.find((option) => option.key === typeKey)?.label ?? "Філіал";

  const employees = (department.employees ?? []).map((employee) => ({
    id: employee.id ?? null,
    name: employee.name,
    note: employee.note ?? "",
    localId: employee.id ?? generateLocalId(),
    userId: employee.userId ?? null,
    email: employee.email ?? "",
  }));

  return {
    id: department.id,
    code: department.code,
    name: department.name,
    typeKey,
    typeLabel,
    branchId: department.branchId ?? "",
    branchName: department.branchName ?? "",
    shippingPoint: department.shippingPoint ?? department.branchName ?? "",
    sourceBranchId: department.sourceBranchId ?? "",
    sourceBranch: department.sourceBranch ?? "",
    addedAt: department.addedAt,
    updatedAt: department.updatedAt,
    employees,
    assignedClients: (department.assignedClients ?? []).map((client) => ({
      id: client.id,
      name: client.name,
      shippingPoint: client.shippingPoint ?? "",
    })),
  };
};

const sortDepartments = (items) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, "uk", { sensitivity: "base" }));

const extractErrorMessage = (error) =>
  error?.response?.data?.error ?? error?.message ?? "Сталася помилка. Спробуйте ще раз.";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function BranchMobileCard({ branch, onEdit, onDelete }) {
  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <header>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500">ID: {branch.id}</span>
        </div>
        <h4 className="font-semibold text-gray-900 text-lg">{branch.name}</h4>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <FaMapMarkerAlt /> {branch.shippingPoint}
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-1">Додано</p>
          <p className="text-gray-900">{formatDate(branch.addedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Оновлено</p>
          <p className="text-gray-900">{formatDateTime(branch.updatedAt)}</p>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Працівники</p>
        <EmployeeList employees={branch.employees} />
      </div>
      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <FaEdit /> Редагувати
        </button>
        <button
          onClick={onDelete}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          <FaTrash /> Видалити
        </button>
      </div>
    </article>
  );
}

function SalesMobileCard({ department, onEdit, onDelete }) {
  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 space-y-3">
      <header>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500">ID: {department.id}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
        {department.assignedClients?.length ? (
          <>
            <p className="text-xs text-gray-500 mt-1">
              Клієнтів: {department.assignedClients.length}
            </p>
            <p className="text-xs text-gray-400 mt-1 truncate">
              Приклади: {department.assignedClients.slice(0, 2).map((client) => client.name).join(", ")}
              {department.assignedClients.length > 2 ? "…" : ""}
            </p>
          </>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-1">Додано</p>
          <p className="text-gray-900">{formatDate(department.addedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Оновлено</p>
          <p className="text-gray-900">{formatDateTime(department.updatedAt)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Працівники (Менеджери)</p>
        <EmployeeList employees={department.employees} />
      </div>

      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <FaEdit /> Редагувати
        </button>
        <button
          onClick={onDelete}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          <FaTrash /> Видалити
        </button>
      </div>
    </article>
  );
}

function StoreMobileCard({ store, onEdit, onDelete }) {
  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 space-y-3">
      <header>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500">ID: {store.id}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <FaMapMarkerAlt /> {store.shippingPoint}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-1">Додано</p>
          <p className="text-gray-900">{formatDate(store.addedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Оновлено</p>
          <p className="text-gray-900">{formatDateTime(store.updatedAt)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Працівники</p>
        <EmployeeList employees={store.employees} />
      </div>

      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <FaEdit /> Редагувати
        </button>
        <button
          onClick={onDelete}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          <FaTrash /> Видалити
        </button>
      </div>
    </article>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function ActionPill({ icon: Icon, label, disabled, onClick }) {
  const baseClasses =
    "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition";

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`${baseClasses} border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed`}
      >
        <Icon size={12} />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300`}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function EmployeeList({ employees }) {
  return (
    <ul className="space-y-2">
      {employees.map((employee) => (
        <li key={employee.id ?? employee.localId ?? employee.name} className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">{employee.name}</span>
          {employee.note ? (
            <span className="block text-xs text-gray-500">{employee.note}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function EmployeeSelector({ selectedEmployees, onAdd, onRemove, userOptions, usersLoading, loadError }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const assignedEmployees = selectedEmployees ?? [];

  const availableOptions = useMemo(() => {
    const source = Array.isArray(userOptions) ? userOptions : [];
    const takenIds = new Set(
      assignedEmployees
        .map((employee) => employee.userId)
        .filter((value) => value != null)
    );
    return source.filter((user) => !takenIds.has(user.id));
  }, [assignedEmployees, userOptions]);

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return availableOptions;
    return availableOptions.filter((option) => {
      const haystack = `${option.displayName ?? ""} ${option.email ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [availableOptions, searchTerm]);

  const handleAddClick = () => {
    if (!selectedUserId) return;
    const user = (Array.isArray(userOptions) ? userOptions : []).find(
      (option) => option.id === selectedUserId
    );
    if (user) {
      onAdd(user);
      setSelectedUserId("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Працівники</h4>
          <p className="text-xs text-gray-500">Додайте зареєстрованих користувачів до підрозділу.</p>
        </div>
      </div>

      {usersLoading ? (
        <div className="text-xs text-gray-500">Завантаження списку користувачів…</div>
      ) : loadError ? (
        <div className="text-xs text-red-500">{loadError}</div>
      ) : (
        <div className="space-y-2">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Пошук за іменем або email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Оберіть користувача…</option>
              {filteredOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                  {user.email ? ` · ${user.email}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddClick}
              disabled={!selectedUserId}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
            >
              Додати
            </button>
          </div>
        </div>
      )}

      {assignedEmployees.length === 0 ? (
        <p className="text-xs text-gray-500">
          Працівників ще не призначено. Додайте хоча б одного, щоб мати контактну особу.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {assignedEmployees.map((employee) => (
            <li key={employee.id ?? employee.localId ?? employee.name}>
              <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                <span>
                  {employee.name}
                  {employee.email ? (
                    <span className="ml-1 text-[11px] text-indigo-200">{employee.email}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(employee)}
                  className="text-indigo-400 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold">{toast.label}</p>
          <p className="text-xs text-gray-300">{toast.entityName}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs uppercase tracking-wide text-gray-300 hover:text-white"
        >
          Закрити
        </button>
      </div>
    </div>
  );
}

function DepartmentEditor({ state, onClose, onSave, userOptions, usersLoading, userLoadError }) {
  const { isOpen, entity, section, mode } = state;
  const isCreate = mode === "create";
  const crumbLabel = isCreate ? "Створити підрозділ" : "Редагувати підрозділ";
  const ActionIcon = isCreate ? FaPlus : FaEdit;
  const defaultType = SECTION_TYPE_MAP[section] ?? "branch";
  const [localState, setLocalState] = useState(() => {
    const seed = entity ?? {};
    return {
      id: seed.id ?? null,
      name: seed.name ?? "",
      typeKey: seed.typeKey ?? defaultType,
      employees: seed.employees ?? [],
      branchId: seed.branchId ?? "",
      shippingPoint: seed.shippingPoint ?? "",
      sourceBranchId: seed.sourceBranchId ?? "",
    };
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const seed = entity ?? {};
    setLocalState({
      id: seed.id ?? null,
      name: seed.name ?? "",
      typeKey: seed.typeKey ?? defaultType,
      employees: seed.employees ?? [],
      branchId: seed.branchId ?? "",
      shippingPoint: seed.shippingPoint ?? "",
      sourceBranchId: seed.sourceBranchId ?? "",
    });
    setErrors({});
  }, [defaultType, entity, isOpen]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && isOpen) {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addEmployee = (employee) => {
    if (!employee) return;
    setLocalState((prev) => {
      const exists = prev.employees.some((item) => item.userId === employee.id);
      if (exists) {
        return prev;
      }
      return {
        ...prev,
        employees: [
          ...prev.employees,
          {
            id: null,
            userId: employee.id,
            name: employee.displayName,
            email: employee.email,
            localId: generateLocalId(),
            note: "",
          },
        ],
      };
    });
  };

  const removeEmployee = (target) => {
    setLocalState((prev) => ({
      ...prev,
      employees: prev.employees.filter((employee) => {
        if (target?.userId && employee.userId) {
          return employee.userId !== target.userId;
        }
        if (target?.id && employee.id) {
          return employee.id !== target.id;
        }
        if (target?.localId && employee.localId) {
          return employee.localId !== target.localId;
        }
        return employee.name !== target?.name;
      }),
    }));
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (!localState.name.trim()) {
      nextErrors.name = "Вкажіть назву підрозділу";
    }
    if (!localState.typeKey) {
      nextErrors.type = "Оберіть тип";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      id: localState.id,
      name: localState.name.trim(),
      typeKey: localState.typeKey,
      employees: localState.employees,
      mode,
      section,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] bg-white shadow-2xl overflow-y-auto">
        <header className="px-6 py-4 border-b border-gray-100">
          <nav className="text-xs text-gray-500 space-x-1">
            <span>Головна</span>
            <span>/</span>
            <span>Відділи</span>
            <span>/</span>
            <span className="text-indigo-600 font-medium">{crumbLabel}</span>
          </nav>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <ActionIcon />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {crumbLabel}
              </h3>
              <p className="text-sm text-gray-500">
                {isCreate
                  ? "Заповніть дані щоб додати новий підрозділ."
                  : "Оновіть назву, тип та закріплених працівників."}
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Назва *</span>
              <input
                value={localState.name}
                onChange={(event) =>
                  setLocalState((prev) => ({ ...prev, name: event.target.value }))
                }
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Наприклад, Київський офіс"
              />
              {errors.name ? (
                <span className="text-xs text-red-500">{errors.name}</span>
              ) : null}
            </label>

            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Тип</span>
              <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                {typeOptions.find((option) => option.key === localState.typeKey)?.label ?? "Підрозділ"}
              </div>
            </div>
          </div>

          <EmployeeSelector
            selectedEmployees={localState.employees}
            onAdd={addEmployee}
            onRemove={removeEmployee}
            userOptions={userOptions}
            usersLoading={usersLoading}
            loadError={userLoadError}
          />
        </div>

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
            {isCreate ? "Створити" : "Зберегти"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function Departments() {
  const [branches, setBranches] = useState([]);
  const [stores, setStores] = useState([]);
  const [salesDepartments, setSalesDepartments] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [areUsersLoading, setAreUsersLoading] = useState(false);
  const [usersLoadError, setUsersLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editorState, setEditorState] = useState({
    isOpen: false,
    entity: null,
    section: null,
    mode: "edit",
  });
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, departmentId: null, section: null });

  const aggregatedStats = useMemo(() => {
    const branchEmployeeCount = branches.reduce(
      (total, branch) => total + branch.employees.length,
      0
    );
    const storeEmployeeCount = stores.reduce(
      (total, store) => total + store.employees.length,
      0
    );
    const salesEmployeeCount = salesDepartments.reduce(
      (total, department) => total + department.employees.length,
      0
    );
    const salesClientsCount = salesDepartments.reduce(
      (total, department) => total + (department.assignedClients?.length || 0),
      0
    );

    return {
      branchEmployeeCount,
      storeEmployeeCount,
      salesEmployeeCount,
      salesClientsCount,
    };
  }, [branches, salesDepartments, stores]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminDepartmentsDashboard();

      setBranches(sortDepartments((data.branches ?? []).map(normalizeDepartment)));
      setStores(sortDepartments((data.stores ?? []).map(normalizeDepartment)));
      setSalesDepartments(sortDepartments((data.salesDepartments ?? []).map(normalizeDepartment)));
      setBranchOptions(
        (data.branchOptions ?? []).map((branch) => ({
          id: branch.id,
          displayName: branch.displayName ?? branch.name ?? branch.code,
        }))
      );
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setAreUsersLoading(true);
      setUsersLoadError(null);
      const data = await fetchAdminUsersDashboard();
      const rawUsers = data?.users ?? data?.Users ?? [];
      const mapped = rawUsers.map((user) => {
        const firstLast = [user.firstName ?? user.FirstName, user.lastName ?? user.LastName]
          .filter(Boolean)
          .join(" ");
        const email = user.email ?? user.Email ?? "";
        const displayName =
          user.displayName ??
          user.DisplayName ??
          (firstLast || email || "Без імені");

        return {
          id: user.id ?? user.Id ?? "",
          displayName,
          email,
        };
      });
      setEmployeeOptions(mapped.filter((option) => option.id));
    } catch (caught) {
      setUsersLoadError(
        caught?.response?.data?.error ??
          caught?.message ??
          "Не вдалося завантажити користувачів для призначення"
      );
    } finally {
      setAreUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadUsers();
  }, [loadDashboard, loadUsers]);

  const openEditor = (section, entity = null, mode = "edit") => {
    setEditorState({ isOpen: true, entity, section, mode });
  };

  const closeEditor = () =>
    setEditorState({ isOpen: false, entity: null, section: null, mode: "edit" });

  const handleSaveEntity = useCallback(
    async (updates) => {
      const { id, mode, section, ...rest } = updates;
      try {
        const payload = {
          name: rest.name,
          type: rest.typeKey,
          branchId: rest.branchId || null,
          sourceBranchId: rest.sourceBranchId || null,
          employees: (rest.employees ?? []).map((employee) => ({
            id: employee.id ?? null,
            userId: employee.userId ?? null,
            name: employee.name,
            note: employee.note || null,
          })),
        };

        const upsert = (setter, transformer) =>
          setter((prev) => sortDepartments(transformer(prev)));

        if (mode === "create") {
          const created = await createAdminDepartment(payload);
          const normalized = normalizeDepartment(created);

          switch (normalized.typeKey) {
            case "branch":
              upsert(setBranches, (prev) => [...prev, normalized]);
              break;
            case "store":
              upsert(setStores, (prev) => [...prev, normalized]);
              break;
            case "sales":
              upsert(setSalesDepartments, (prev) => [...prev, normalized]);
              break;
            default:
              break;
          }

          setToast({ id: Date.now(), label: "Підрозділ створено", entityName: normalized.name });
        } else {
          const updated = await updateAdminDepartment(id, payload);
          const normalized = normalizeDepartment(updated);

          switch (normalized.typeKey) {
            case "branch":
              upsert(setBranches, (prev) =>
                prev.map((item) => (item.id === normalized.id ? normalized : item))
              );
              break;
            case "store":
              upsert(setStores, (prev) =>
                prev.map((item) => (item.id === normalized.id ? normalized : item))
              );
              break;
            case "sales":
              upsert(setSalesDepartments, (prev) =>
                prev.map((item) => (item.id === normalized.id ? normalized : item))
              );
              break;
            default:
              break;
          }

          setToast({ id: Date.now(), label: "Дані збережено", entityName: normalized.name });
        }

        closeEditor();
      } catch (saveError) {
        setError(extractErrorMessage(saveError));
      }
    },
    [closeEditor]
  );

  const openDeleteConfirm = (departmentId, section) => {
    setDeleteConfirm({ isOpen: true, departmentId, section });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, departmentId: null, section: null });
  };

  const handleDeleteDepartment = useCallback(
    async () => {
      const { departmentId, section } = deleteConfirm;
      closeDeleteConfirm();

      try {
        await deleteAdminDepartment(departmentId);

        const removeFromList = (setter) =>
          setter((prev) => prev.filter((item) => item.id !== departmentId));

        switch (section) {
          case "branches":
            removeFromList(setBranches);
            break;
          case "stores":
            removeFromList(setStores);
            break;
          case "sales":
            removeFromList(setSalesDepartments);
            break;
          default:
            break;
        }

        setToast({ id: Date.now(), label: "Підрозділ видалено", entityName: "" });
      } catch (deleteError) {
        setError(extractErrorMessage(deleteError));
      }
    },
    [deleteConfirm]
  );

  const metrics = [
    {
      id: "branches",
      label: "Філіали",
      value: branches.length,
      description: `Працівників: ${aggregatedStats.branchEmployeeCount}`,
      Icon: FaBuilding,
    },
    {
      id: "sales",
      label: "Відділ продажу",
      value: salesDepartments.length,
      description: `${aggregatedStats.salesEmployeeCount} менеджерів · клієнтів: ${aggregatedStats.salesClientsCount}`,
      Icon: FaUserTie,
    },
    {
      id: "stores",
      label: "Магазини",
      value: stores.length,
      description: `Працівників: ${aggregatedStats.storeEmployeeCount}`,
      Icon: FaStore,
    },
  ];

  return (
    <HomeLayout
      children={
        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <FaClipboardList />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Відділи компанії</h2>
                  <p className="text-sm text-gray-600">
                    Керуйте філіалами, магазинами та менеджерами продажів. Переконайтесь, що
                    кожен підрозділ має відповідальних співробітників і актуальні точки
                    відвантаження.
                  </p>
                </div>
              </div>
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                <li>
                  <span className="font-semibold text-gray-900">Філіали</span> — точки
                  відвантаження для магазинів і користувачів.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600">
                    <li>Щоденно оновлюють залишки (дія «Завантажити наявність»).</li>
                    <li>Отримують сповіщення про замовлення на свою адресу.</li>
                    <li>Мають повну історію замовлень, що проходили через філіал.</li>
                  </ul>
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Магазини</span> — точки
                  відвантаження для клієнтів.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600">
                    <li>Оновлюють власні залишки.
                    </li>
                    <li>Отримують сповіщення про замовлення та можуть робити заявки на філіали.</li>
                    <li>Мають доступ до історії замовлень по своїй точці.</li>
                  </ul>
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Відділ продажу</span> — менеджери, закріплені за клієнтами.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600">
                    <li>При нових реєстраціях клієнта автоматично призначається менеджер.</li>
                    <li>Коли клієнт оформлює замовлення, сповіщення отримує менеджер і його точка відвантаження.</li>
                    <li>Менеджер матиме доступ до історії замовлень клієнтів (функціонал доробляється).</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const MetricIcon = metric.Icon;
              return (
                <article
                  key={metric.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3"
                >
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                    <MetricIcon />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                    <p className="text-sm text-gray-600">{metric.description}</p>
                  </div>
                </article>
              );
            })}
          </section>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <section className="bg-white border border-gray-200 rounded-xl shadow p-6 text-center text-gray-600">
              Завантаження даних підрозділів...
            </section>
          ) : null}

          <section className="bg-white rounded-xl shadow border border-gray-200">
            <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaBuilding className="text-indigo-500" />
                  Філіали
                </h3>
                <p className="text-sm text-gray-600">
                  Використовуються магазинами та клієнтами як точки відвантаження.
                </p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <button
                  type="button"
                  onClick={() => openEditor("branches", null, "create")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  <FaPlus /> Новий філіал
                </button>
              </div>
            </header>
            <div className="px-4 py-4 md:hidden">
              <div className="grid gap-4">
                {branches.map((branch) => (
                  <BranchMobileCard
                    key={`${branch.id}-mobile`}
                    branch={branch}
                    onEdit={() => openEditor("branches", branch)}
                    onDelete={() => openDeleteConfirm(branch.id, "branches")}
                  />
                ))}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left w-16">ID</th>
                    <th className="px-6 py-3 text-left">Назва</th>
                    <th className="px-6 py-3 text-left w-32">Додано</th>
                    <th className="px-6 py-3 text-left w-32">Оновлено</th>
                    <th className="px-6 py-3 text-left w-48">Працівники</th>
                    <th className="px-6 py-3 text-left w-40">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-indigo-50/40">
                      <td className="px-6 py-3 font-semibold text-gray-900">{branch.id}</td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-gray-900">{branch.name}</div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt /> {branch.shippingPoint}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{formatDate(branch.addedAt)}</td>
                      <td className="px-6 py-3 text-gray-600">{formatDateTime(branch.updatedAt)}</td>
                      <td className="px-6 py-3">
                        <EmployeeList employees={branch.employees} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <ActionPill
                            icon={FaEdit}
                            label="Редагувати"
                            onClick={() => openEditor("branches", branch)}
                          />
                          <ActionPill
                            icon={FaTrash}
                            label="Видалити"
                            onClick={() => openDeleteConfirm(branch.id, "branches")}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200">
            <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaUserTie className="text-indigo-500" />
                  Відділ продажу
                </h3>
                <p className="text-sm text-gray-600">
                  Менеджери, закріплені за клієнтами. Налаштовуйте сповіщення та контролюйте історію замовлень.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEditor("sales", null, "create")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <FaPlus /> Новий відділ продажу
              </button>
            </header>
            <div className="px-4 py-4 md:hidden">
              <div className="grid gap-4">
                {salesDepartments.map((department) => (
                  <SalesMobileCard
                    key={`${department.id}-mobile`}
                    department={department}
                    onEdit={() => openEditor("sales", department)}
                    onDelete={() => openDeleteConfirm(department.id, "sales")}
                  />
                ))}
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left w-16">ID</th>
                    <th className="px-6 py-3 text-left">Назва</th>
                    <th className="px-6 py-3 text-left w-32">Додано</th>
                    <th className="px-6 py-3 text-left w-32">Оновлено</th>
                    <th className="px-6 py-3 text-left w-48">Працівники</th>
                    <th className="px-6 py-3 text-left w-40">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesDepartments.map((department) => (
                    <tr key={department.id} className="hover:bg-indigo-50/40">
                      <td className="px-6 py-3 font-semibold text-gray-900">{department.id}</td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-gray-900">{department.name}</div>
                        {department.assignedClients?.length ? (
                          <p className="text-xs text-gray-500 mt-1">
                            Клієнтів: {department.assignedClients.length}
                          </p>
                        ) : null}
                        {department.assignedClients?.length ? (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            Приклади: {department.assignedClients.slice(0, 2).map((client) => client.name).join(", ")}
                            {department.assignedClients.length > 2 ? "…" : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{formatDate(department.addedAt)}</td>
                      <td className="px-6 py-3 text-gray-600">{formatDateTime(department.updatedAt)}</td>
                      <td className="px-6 py-3">
                        <EmployeeList employees={department.employees} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <ActionPill
                            icon={FaEdit}
                            label="Редагувати"
                            onClick={() => openEditor("sales", department)}
                          />
                          <ActionPill
                            icon={FaTrash}
                            label="Видалити"
                            onClick={() => openDeleteConfirm(department.id, "sales")}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200">
            <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaStore className="text-indigo-500" />
                  Магазини
                </h3>
                <p className="text-sm text-gray-600">
                  Торгові точки, що працюють з кінцевими клієнтами та роблять замовлення на філіали.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEditor("stores", null, "create")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <FaPlus /> Новий магазин
              </button>
            </header>
            <div className="px-4 py-4 md:hidden">
              <div className="grid gap-4">
                {stores.map((store) => (
                  <StoreMobileCard
                    key={`${store.id}-mobile`}
                    store={store}
                    onEdit={() => openEditor("stores", store)}
                    onDelete={() => openDeleteConfirm(store.id, "stores")}
                  />
                ))}
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left w-16">ID</th>
                    <th className="px-6 py-3 text-left">Назва</th>
                    <th className="px-6 py-3 text-left w-32">Додано</th>
                    <th className="px-6 py-3 text-left w-32">Оновлено</th>
                    <th className="px-6 py-3 text-left w-48">Працівники</th>
                    <th className="px-6 py-3 text-left w-40">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-indigo-50/40">
                      <td className="px-6 py-3 font-semibold text-gray-900">{store.id}</td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-gray-900">{store.name}</div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt /> {store.shippingPoint}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{formatDate(store.addedAt)}</td>
                      <td className="px-6 py-3 text-gray-600">{formatDateTime(store.updatedAt)}</td>
                      <td className="px-6 py-3">
                        <EmployeeList employees={store.employees} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <ActionPill
                            icon={FaEdit}
                            label="Редагувати"
                            onClick={() => openEditor("stores", store)}
                          />
                          <ActionPill
                            icon={FaTrash}
                            label="Видалити"
                            onClick={() => openDeleteConfirm(store.id, "stores")}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <DepartmentEditor
            state={editorState}
            onClose={closeEditor}
            onSave={handleSaveEntity}
            branchOptions={branchOptions}
            userOptions={employeeOptions}
            usersLoading={areUsersLoading}
            userLoadError={usersLoadError}
          />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
          <ConfirmDialog
            isOpen={deleteConfirm.isOpen}
            title="Видалення підрозділу"
            message="Ви впевнені, що хочете видалити цей підрозділ? Цю дію не можна буде скасувати."
            onConfirm={handleDeleteDepartment}
            onCancel={closeDeleteConfirm}
          />
        </div>
      }
    />
  );
}
