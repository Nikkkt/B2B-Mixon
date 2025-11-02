import { useEffect, useMemo, useState } from "react";
import HomeLayout from "../components/HomeLayout";
import {
  FaBuilding,
  FaStore,
  FaUserTie,
  FaBell,
  FaHistory,
  FaTruck,
  FaClipboardList,
  FaMapMarkerAlt,
  FaUsers,
  FaEdit,
} from "react-icons/fa";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function BranchMobileCard({ branch, onAction, onEdit }) {
  const handleAction = (actionKey, label) =>
    onAction("branch", branch, actionKey, label);

  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">ID</p>
          <p className="text-lg font-semibold text-gray-900">{branch.id}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Редагувати
        </button>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900">{branch.name}</h3>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <FaMapMarkerAlt className="text-gray-400" /> {branch.shippingPoint}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Оновлено: {formatDateTime(branch.updatedAt)}
        </p>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Працівники</h4>
        <EmployeeList employees={branch.employees} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionPill
          icon={FaTruck}
          label="Завантажити"
          onClick={() => handleAction("loadStock", "Завантажити наявність")}
        />
        <ActionPill
          icon={FaBell}
          label="Сповіщення"
          onClick={() => handleAction("notifications", "Сповіщення")}
        />
        <ActionPill
          icon={FaHistory}
          label="Історія"
          onClick={() => handleAction("history", "Історія")}
        />
      </div>
    </article>
  );
}

function SalesMobileCard({ department, onAction, onEdit }) {
  const handleAction = (actionKey, label) =>
    onAction("sales", department, actionKey, label);

  const sampleClients = department.assignedClients?.slice(0, 2) || [];

  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">ID</p>
          <p className="text-lg font-semibold text-gray-900">{department.id}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Редагувати
        </button>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900">{department.name}</h3>
        <p className="text-xs text-gray-400 mt-1">
          Оновлено: {formatDateTime(department.updatedAt)}
        </p>
        {department.assignedClients?.length ? (
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Клієнтів: {department.assignedClients.length}</p>
            <p className="text-gray-400">
              Приклади: {sampleClients.map((client) => client.name).join(", ")}
              {department.assignedClients.length > 2 ? "…" : ""}
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Менеджери</h4>
        <EmployeeList employees={department.employees} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionPill
          icon={FaUsers}
          label="Менеджер"
          onClick={() => handleAction("assignManager", "Призначити менеджера")}
        />
        <ActionPill
          icon={FaBell}
          label="Сповіщення"
          onClick={() => handleAction("notifications", "Сповіщення")}
        />
        <ActionPill
          icon={FaHistory}
          label="Історія"
          onClick={() => handleAction("history", "Історія")}
        />
      </div>
    </article>
  );
}

function StoreMobileCard({ store, onAction, onEdit }) {
  const handleAction = (actionKey, label) =>
    onAction("store", store, actionKey, label);

  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">ID</p>
          <p className="text-lg font-semibold text-gray-900">{store.id}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Редагувати
        </button>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900">{store.name}</h3>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <FaMapMarkerAlt className="text-gray-400" /> {store.shippingPoint}
        </p>
        <p className="text-xs text-gray-400 mt-1">Відправник: {store.sourceBranch}</p>
        <p className="text-xs text-gray-400 mt-1">
          Оновлено: {formatDateTime(store.updatedAt)}
        </p>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Працівники</h4>
        <EmployeeList employees={store.employees} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionPill
          icon={FaTruck}
          label="Наявність"
          onClick={() => handleAction("loadStock", "Завантажити наявність")}
        />
        <ActionPill
          icon={FaBell}
          label="Сповіщення"
          onClick={() => handleAction("notifications", "Сповіщення")}
        />
        <ActionPill
          icon={FaClipboardList}
          label="Замовити"
          onClick={() => handleAction("submitOrder", "Замовити на філіал")}
        />
        <ActionPill
          icon={FaHistory}
          label="Історія"
          onClick={() => handleAction("history", "Історія")}
        />
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

const initialBranches = [
  {
    id: "11",
    name: "1 - Головний склад Одеса",
    type: "Філіал",
    shippingPoint: "1 - Головний склад Одеса",
    addedAt: "2021-09-09T00:00:00",
    updatedAt: "2025-10-26T06:25:00",
    employees: [
      { name: "Рахор Рах", note: "Контроль залишків" },
      { name: "Слобік Дмитрій", note: "Менеджер складу" },
      { name: "Шевченко Алёна", note: "Обробка замовлень" },
    ],
  },
  {
    id: "77",
    name: "2 - Склад Філіал Київ",
    type: "Філіал",
    shippingPoint: "1 - Головний склад Одеса",
    addedAt: "2021-10-26T08:40:00",
    updatedAt: "2025-10-25T08:52:00",
    employees: [
      { name: "Слобік Дмитрій", note: "Куратор регіону" },
      { name: "Рудак Оксана", note: "Сповіщення про замовлення" },
    ],
  },
  {
    id: "79",
    name: "3 - Склад Філіал Луцьк",
    type: "Філіал",
    shippingPoint: "1 - Головний склад Одеса",
    addedAt: "2021-10-26T08:17:00",
    updatedAt: "2025-10-12T12:23:00",
    employees: [
      { name: "Кравчук Олег", note: "Логістика" },
      { name: "Слобік Дмитрій", note: "Координація" },
    ],
  },
  {
    id: "84",
    name: "4 - Склад Філіал Рівне",
    type: "Філіал",
    shippingPoint: "1 - Головний склад Одеса",
    addedAt: "2021-10-26T08:17:00",
    updatedAt: "2025-10-12T16:25:00",
    employees: [
      { name: "Слободянюк Ірина", note: "Контроль залишків" },
      { name: "Слобік Дмитрій", note: "Куратор" },
    ],
  },
  {
    id: "88",
    name: "5 - Склад Філіал Хмельницький",
    type: "Філіал",
    shippingPoint: "1 - Головний склад Одеса",
    addedAt: "2021-10-26T08:17:00",
    updatedAt: "2025-10-12T12:54:00",
    employees: [
      { name: "Мельник Сергій", note: "Прийом замовлень" },
      { name: "Слобік Дмитрій", note: "Куратор" },
    ],
  },
  {
    id: "92",
    name: "Таможений склад",
    type: "Філіал",
    shippingPoint: "1 - Головний склад Одеса",
    addedAt: "2022-08-02T18:28:00",
    updatedAt: "2025-10-12T18:23:00",
    employees: [
      { name: "Поповський Віктор", note: "Координація імпорту" },
      { name: "Слобік Дмитрій", note: "Підтвердження замовлень" },
    ],
  },
];

const initialStores = [
  {
    id: "68",
    name: "100 - Магазин на Промисловій Одеса",
    type: "Магазин",
    shippingPoint: "100 - Магазин на Промисловій Одеса",
    sourceBranch: "1 - Головний склад Одеса",
    addedAt: "2022-10-03T12:14:00",
    updatedAt: "2025-09-29T08:41:00",
    employees: [
      { name: "Поліщук Віктор", note: "Оновлення залишків" },
      { name: "Слобік Дмитрій", note: "Керуючий" },
    ],
  },
  {
    id: "100",
    name: "103 - Магазин Ільфа та Петрова",
    type: "Магазин",
    shippingPoint: "103 - Магазин Ільфа та Петрова",
    sourceBranch: "2 - Склад Філіал Київ",
    addedAt: "2023-04-12T09:00:00",
    updatedAt: "2025-10-20T17:32:00",
    employees: [
      { name: "Черненко Олена", note: "Замовлення клієнтів" },
      { name: "Бондар Володимир", note: "Підтримка магазину" },
    ],
  },
  {
    id: "108",
    name: "108 - Магазин Раскідайловська",
    type: "Магазин",
    shippingPoint: "108 - Магазин Раскідайловська",
    sourceBranch: "1 - Головний склад Одеса",
    addedAt: "2024-02-15T10:11:00",
    updatedAt: "2025-10-18T09:45:00",
    employees: [
      { name: "Дяченко Павло", note: "Стежить за залишками" },
      { name: "Слобік Дмитрій", note: "Керівник точки" },
    ],
  },
];

const initialSalesDepartments = [
  {
    id: "94",
    name: "ОП Одеса",
    type: "Відділ продажу",
    addedAt: "2023-09-29T06:12:00",
    updatedAt: "2025-09-29T06:12:00",
    employees: [
      { name: "Слобік Дмитрій", note: "Старший менеджер" },
      { name: "Тест Тест", note: "Асистент" },
    ],
    assignedClients: [
      { name: "ТОВ Мікс Ін.", shippingPoint: "100 - Магазин на Промисловій Одеса" },
      { name: "Rasmussen and Gomez Plc", shippingPoint: "1 - Головний склад Одеса" },
      { name: "ООП Мітія В.А.", shippingPoint: "103 - Магазин Ільфа та Петрова" },
    ],
  },
];

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
        <li key={employee.name} className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">{employee.name}</span>
          {employee.note ? (
            <span className="block text-xs text-gray-500">{employee.note}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function buildActionContext({
  actionKey,
  entityType,
  entityName,
  label,
  shippingPoint,
  sourceBranch,
  assignedClients = [],
}) {
  const entityLabelMap = {
    branch: "Філіал",
    store: "Магазин",
    sales: "Відділ продажу",
  };

  const displayName = `${entityLabelMap[entityType] || "Підрозділ"} «${entityName}»`;

  switch (actionKey) {
    case "loadStock": {
      const isStore = entityType === "store";
      return {
        icon: FaTruck,
        title: label,
        subtitle: displayName,
        lead: isStore
          ? `${displayName} має щоденно оновлювати залишки, аби клієнти бачили актуальний асортимент.`
          : `${displayName} відповідає за відвантаження та контроль залишків для магазинів.`,
        steps: [
          "Перейдіть у розділ «Перегляд наявності».",
          isStore
            ? "Оновіть залишки вручну або завантажте підготовлений файл зі складськими даними."
            : "Підготуйте актуальний файл з залишками та внесіть його у систему.",
          shippingPoint
            ? `Після збереження даних сповіщення автоматично піде на точку «${shippingPoint}».`
            : "Після збереження даних система сповістить закріплених співробітників.",
        ],
        note: "Видимість товарів у каталозі залежить від актуальності цього оновлення.",
      };
    }
    case "notifications": {
      const isSales = entityType === "sales";
      return {
        icon: FaBell,
        title: label,
        subtitle: displayName,
        lead: isSales
          ? "Менеджери повинні оперативно отримувати заявки своїх клієнтів. Переконайтесь, що канали сповіщень налаштовані."
          : "Налаштуйте, хто отримує оперативні сповіщення та в якому форматі.",
        steps: isSales
          ? [
              "У розділі «Користувачі» перевірте, що кожен клієнт має призначеного менеджера з цього відділу.",
              "Відкрийте картку менеджера та додайте робочі e-mail і месенджер, на які слід дублювати сповіщення.",
              assignedClients.length
                ? `Для ${assignedClients.length} клієнтів можна налаштувати резервну пошту (наприклад, sales@mixon.ua) у полі «Додаткові копії».`
                : "Для кожного клієнта вкажіть резервну пошту (наприклад, sales@mixon.ua) у полі «Додаткові копії».",
            ]
          : [
              "У розділі «Користувачі» перевірте, що всі відповідальні співробітники прив'язані до підрозділу.",
              shippingPoint
                ? `Сповіщення дублюються на точку відвантаження «${shippingPoint}». Переконайтесь, що поштові адреси актуальні.`
                : "Перевірте, що контактні дані працівників актуальні.",
              "За потреби додайте резервний канал (e-mail, месенджер) у профілі користувача.",
            ],
        note: isSales
          ? "Після підключення push-каналу менеджери зможуть отримувати миттєві повідомлення у мобільному застосунку."
          : "Розширені канали (SMS, Viber) будуть доступні після запуску нового модуля сповіщень.",
      };
    }
    case "history": {
      const isSales = entityType === "sales";
      return {
        icon: FaHistory,
        title: label,
        subtitle: displayName,
        lead: isSales
          ? "Проаналізуйте історію замовлень клієнтів, закріплених за менеджерами відділу продажу."
          : "Перегляньте та проаналізуйте повну хронологію замовлень.",
        steps: isSales
          ? [
              "У розділі «Замовлення товарів» відкрийте фільтри та виберіть відповідальних менеджерів з цього відділу.",
              "Сортуйте за клієнтом або датою, щоб побачити повторні замовлення та середній чек.",
              "Сформуйте XLS-звіт, щоб підготувати персональні пропозиції для активних клієнтів.",
            ]
          : [
              "Перейдіть у розділ «Замовлення товарів».",
              "Встановіть фільтр за вашим підрозділом і датами, щоб отримати потрібну вибірку.",
              "За потреби експортуйте таблицю у XLS для внутрішньої звітності.",
            ],
        note: isSales
          ? "Дані історії допомагають готувати апселл-пропозиції та контролювати активність клієнтів."
          : "Історія замовлень допомагає швидко знайти повторні запити клієнтів.",
      };
    }
    case "submitOrder": {
      return {
        icon: FaClipboardList,
        title: label,
        subtitle: displayName,
        lead: sourceBranch
          ? `${displayName} може сформувати заявку на поповнення зі складу «${sourceBranch}».`
          : `${displayName} може сформувати заявку на поповнення товарів до відповідального складу.`,
        steps: [
          "Перейдіть у розділ «Замовлення товарів» або «Замовлення по кодах».",
          "Додайте позиції, вкажіть необхідну кількість та перевірте наявність альтернатив.",
          sourceBranch
            ? `Після підтвердження система надішле заявку на філіал «${sourceBranch}» і сповістить відповідальних.`
            : "Після підтвердження система сповістить відповідальний філіал та менеджера.",
        ],
        note: "Заявка з'явиться в історії замовлень одразу після відправлення.",
      };
    }
    case "assignManager": {
      return {
        icon: FaUsers,
        title: label,
        subtitle: displayName,
        lead: "Призначте відповідального менеджера кожному новому користувачу одразу після реєстрації.",
        steps: [
          "Перейдіть у розділ «Користувачі» та відсортуйте список за новими реєстраціями.",
          "Відкрийте картку клієнта та у блоці ролей оберіть менеджера з цього відділу продажу.",
          "Збережіть зміни, щоб менеджер почав отримувати сповіщення та бачити історію замовлень клієнта.",
        ],
        note: "Після призначення менеджера сповіщення надсилатимуться одночасно на його пошту та на точку відвантаження клієнта.",
      };
    }
    default:
      return {
        icon: FaClipboardList,
        title: label,
        subtitle: displayName,
        lead: "Дія перебуває у розробці. Скористайтеся контактами менеджера для ручного опрацювання.",
        steps: [
          "Зберіть необхідну інформацію та передайте її відповідальному менеджеру.",
        ],
      };
  }
}

function ActionDialog({ context, onClose }) {
  if (!context) return null;
  const Icon = context.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Icon />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{context.title}</h3>
            <p className="text-sm text-gray-500">{context.subtitle}</p>
          </div>
        </header>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">{context.lead}</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            {context.steps.map((step, index) => (
              <li key={`${context.title}-${index}`}>{step}</li>
            ))}
          </ul>
          {context.note ? (
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm rounded-lg px-4 py-3">
              {context.note}
            </div>
          ) : null}
        </div>
        <footer className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            Закрити
          </button>
        </footer>
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

function DepartmentEditor({ state, onClose, onSave }) {
  const { isOpen, entity } = state;
  const [localState, setLocalState] = useState(() => {
    if (!entity) {
      return {
        id: "",
        name: "",
        type: "Філіал",
        employees: [],
        shippingPoint: "",
        sourceBranch: "",
      };
    }
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      employees: entity.employees || [],
      shippingPoint: entity.shippingPoint || "",
      sourceBranch: entity.sourceBranch || "",
    };
  });
  const [employeeInput, setEmployeeInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (entity) {
      setLocalState({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        employees: entity.employees || [],
        shippingPoint: entity.shippingPoint || "",
        sourceBranch: entity.sourceBranch || "",
      });
      setErrors({});
      setEmployeeInput("");
    }
  }, [entity]);

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

  if (!isOpen || !entity) return null;

  const addEmployee = () => {
    if (!employeeInput.trim()) return;
    setLocalState((prev) => ({
      ...prev,
      employees: [
        ...prev.employees,
        {
          name: employeeInput.trim(),
          note: "",
        },
      ],
    }));
    setEmployeeInput("");
  };

  const removeEmployee = (name) => {
    setLocalState((prev) => ({
      ...prev,
      employees: prev.employees.filter((employee) => employee.name !== name),
    }));
  };

  const handleSubmit = () => {
    const nextErrors = {};
    if (!localState.name.trim()) {
      nextErrors.name = "Вкажіть назву підрозділу";
    }
    if (!localState.type) {
      nextErrors.type = "Оберіть тип";
    }
    if (localState.type !== "Відділ продажу" && !localState.shippingPoint.trim()) {
      nextErrors.shippingPoint = "Заповніть точку відвантаження";
    }
    if (localState.type === "Магазин" && !localState.sourceBranch.trim()) {
      nextErrors.sourceBranch = "Вкажіть філіал-відправник";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave(entity.id, {
      ...entity,
      name: localState.name.trim(),
      type: localState.type,
      employees: localState.employees,
      shippingPoint: localState.shippingPoint.trim(),
      sourceBranch:
        localState.type === "Магазин" ? localState.sourceBranch.trim() : entity.sourceBranch,
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
            <span className="text-indigo-600 font-medium">Редагувати підрозділ</span>
          </nav>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <FaEdit />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Редагувати підрозділ</h3>
              <p className="text-sm text-gray-500">Оновіть назву, тип та закріплених працівників.</p>
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
                placeholder="Введіть назву"
              />
              {errors.name ? (
                <span className="text-xs text-red-500">{errors.name}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Тип *</span>
              <select
                value={localState.type}
                onChange={(event) =>
                  setLocalState((prev) => ({ ...prev, type: event.target.value }))
                }
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.type ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="Філіал">Філіал</option>
                <option value="Магазин">Магазин</option>
                <option value="Відділ продажу">Відділ продажу</option>
              </select>
              {errors.type ? (
                <span className="text-xs text-red-500">{errors.type}</span>
              ) : null}
            </label>
          </div>

          {localState.type !== "Відділ продажу" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Точка відвантаження *</span>
              <input
                value={localState.shippingPoint}
                onChange={(event) =>
                  setLocalState((prev) => ({ ...prev, shippingPoint: event.target.value }))
                }
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.shippingPoint ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Наприклад, 1 - Головний склад Одеса"
              />
              {errors.shippingPoint ? (
                <span className="text-xs text-red-500">{errors.shippingPoint}</span>
              ) : null}
            </label>
          ) : null}

          {localState.type === "Магазин" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Філіал-відправник *</span>
              <input
                value={localState.sourceBranch}
                onChange={(event) =>
                  setLocalState((prev) => ({ ...prev, sourceBranch: event.target.value }))
                }
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.sourceBranch ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Наприклад, 1 - Головний склад Одеса"
              />
              {errors.sourceBranch ? (
                <span className="text-xs text-red-500">{errors.sourceBranch}</span>
              ) : null}
            </label>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Працівники</h4>
                <p className="text-xs text-gray-500">Введіть ім'я і натисніть Enter, щоб додати нового працівника.</p>
              </div>
            </div>
            <input
              value={employeeInput}
              onChange={(event) => setEmployeeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addEmployee();
                }
              }}
              placeholder="Наприклад, Слобік Дмитрій"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {localState.employees.length === 0 ? (
              <p className="text-xs text-gray-500">
                Працівників ще не призначено. Додайте хоча б одного, щоб мати контактну особу.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {localState.employees.map((employee) => (
                  <li key={employee.name}>
                    <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                      {employee.name}
                      <button
                        type="button"
                        onClick={() => removeEmployee(employee.name)}
                        className="text-indigo-500 hover:text-indigo-700"
                      >
                        ×
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
            Зберегти
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function Departments() {
  const [branches, setBranches] = useState(initialBranches);
  const [stores, setStores] = useState(initialStores);
  const [salesDepartments, setSalesDepartments] = useState(initialSalesDepartments);
  const [editorState, setEditorState] = useState({ isOpen: false, entity: null, section: null });

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

  const [actionContext, setActionContext] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const closeActionDialog = () => setActionContext(null);

  const handleAction = (entityType, entity, actionKey, label) => {
    const context = buildActionContext({
      actionKey,
      entityType,
      entityName: entity.name,
      label,
      shippingPoint: entity.shippingPoint,
      sourceBranch: entity.sourceBranch,
      assignedClients: entity.assignedClients,
    });
    setActionContext(context);
    setToast({ id: Date.now(), label, entityName: entity.name });
  };

  const openEditor = (section, entity) => {
    setEditorState({ isOpen: true, entity, section });
  };

  const closeEditor = () => setEditorState({ isOpen: false, entity: null, section: null });

  const handleSaveEntity = (id, updates) => {
    const applyUpdate = (list, setter) => {
      setter((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    };

    switch (editorState.section) {
      case "branches":
        applyUpdate(branches, setBranches);
        break;
      case "stores":
        applyUpdate(stores, setStores);
        break;
      case "sales":
        applyUpdate(salesDepartments, setSalesDepartments);
        break;
      default:
        break;
    }

    setToast({ id: Date.now(), label: "Дані збережено", entityName: updates.name });
    closeEditor();
  };

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
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                  <FaTruck /> Завантаження залишків
                </span>
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  <FaBell /> Сповіщення про замовлення
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-3 py-1 rounded-full">
                  <FaHistory /> Історія замовлень
                </span>
              </div>
            </header>
            <div className="px-4 py-4 md:hidden">
              <div className="grid gap-4">
                {branches.map((branch) => (
                  <BranchMobileCard
                    key={`${branch.id}-mobile`}
                    branch={branch}
                    onAction={handleAction}
                    onEdit={() => openEditor("branches", branch)}
                  />
                ))}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">Назва</th>
                    <th className="px-6 py-3 text-left">Додано</th>
                    <th className="px-6 py-3 text-left">Оновлено</th>
                    <th className="px-6 py-3 text-left">Працівники</th>
                    <th className="px-6 py-3 text-left">Дії</th>
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
                        <div className="flex flex-wrap gap-2">
                          <ActionPill
                            icon={FaTruck}
                            label="Завантажити наявність"
                            onClick={() => handleAction("branch", branch, "loadStock", "Завантажити наявність")}
                          />
                          <ActionPill
                            icon={FaBell}
                            label="Сповіщення"
                            onClick={() => handleAction("branch", branch, "notifications", "Сповіщення")}
                          />
                          <ActionPill
                            icon={FaHistory}
                            label="Історія"
                            onClick={() => handleAction("branch", branch, "history", "Історія")}
                          />
                          <ActionPill
                            icon={FaEdit}
                            label="Редагувати"
                            onClick={() => openEditor("branches", branch)}
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
            </header>
            <div className="px-4 py-4 md:hidden">
              <div className="grid gap-4">
                {salesDepartments.map((department) => (
                  <SalesMobileCard
                    key={`${department.id}-mobile`}
                    department={department}
                    onAction={handleAction}
                    onEdit={() => openEditor("sales", department)}
                  />
                ))}
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">Назва</th>
                    <th className="px-6 py-3 text-left">Додано</th>
                    <th className="px-6 py-3 text-left">Оновлено</th>
                    <th className="px-6 py-3 text-left">Менеджери</th>
                    <th className="px-6 py-3 text-left">Дії</th>
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
                        <div className="flex flex-wrap gap-2">
                          <ActionPill
                            icon={FaUsers}
                            label="Призначити менеджера"
                            onClick={() =>
                              handleAction(
                                "sales",
                                department,
                                "assignManager",
                                "Призначити менеджера"
                              )
                            }
                          />
                          <ActionPill
                            icon={FaBell}
                            label="Сповіщення"
                            onClick={() =>
                              handleAction("sales", department, "notifications", "Сповіщення")
                            }
                          />
                          <ActionPill
                            icon={FaHistory}
                            label="Історія"
                            onClick={() =>
                              handleAction("sales", department, "history", "Історія")
                            }
                          />
                          <ActionPill
                            icon={FaEdit}
                            label="Редагувати"
                            onClick={() => openEditor("sales", department)}
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
            </header>
            <div className="px-4 py-4 md:hidden">
              <div className="grid gap-4">
                {stores.map((store) => (
                  <StoreMobileCard
                    key={`${store.id}-mobile`}
                    store={store}
                    onAction={handleAction}
                    onEdit={() => openEditor("stores", store)}
                  />
                ))}
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">Назва</th>
                    <th className="px-6 py-3 text-left">Філіал-відправник</th>
                    <th className="px-6 py-3 text-left">Додано</th>
                    <th className="px-6 py-3 text-left">Оновлено</th>
                    <th className="px-6 py-3 text-left">Працівники</th>
                    <th className="px-6 py-3 text-left">Дії</th>
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
                      <td className="px-6 py-3 text-gray-600">{store.sourceBranch}</td>
                      <td className="px-6 py-3 text-gray-600">{formatDate(store.addedAt)}</td>
                      <td className="px-6 py-3 text-gray-600">{formatDateTime(store.updatedAt)}</td>
                      <td className="px-6 py-3">
                        <EmployeeList employees={store.employees} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          <ActionPill
                            icon={FaTruck}
                            label="Завантажити наявність"
                            onClick={() => handleAction("store", store, "loadStock", "Завантажити наявність")}
                          />
                          <ActionPill
                            icon={FaBell}
                            label="Сповіщення"
                            onClick={() => handleAction("store", store, "notifications", "Сповіщення")}
                          />
                          <ActionPill
                            icon={FaClipboardList}
                            label="Замовити на філіал"
                            onClick={() => handleAction("store", store, "submitOrder", "Замовити на філіал")}
                          />
                          <ActionPill
                            icon={FaHistory}
                            label="Історія"
                            onClick={() => handleAction("store", store, "history", "Історія")}
                          />
                          <ActionPill
                            icon={FaEdit}
                            label="Редагувати"
                            onClick={() => openEditor("stores", store)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ActionDialog context={actionContext} onClose={closeActionDialog} />
          <DepartmentEditor state={editorState} onClose={closeEditor} onSave={handleSaveEntity} />
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
      }
    />
  );
}
