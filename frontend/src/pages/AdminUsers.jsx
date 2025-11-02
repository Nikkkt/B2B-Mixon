import { useState, useEffect, useMemo } from "react";
import HomeLayout from "../components/HomeLayout";
import {
  FaBell,
  FaUserPlus,
  FaSearch,
  FaUserShield,
  FaTruck,
  FaPercent,
  FaLayerGroup,
  FaEye,
  FaTimes,
  FaSave,
} from "react-icons/fa";

const shippingPoints = [
  { id: "br1", name: "11 - Головний склад Одеса" },
  { id: "br2", name: "77 - Склад Філіал Київ" },
  { id: "br3", name: "103 - Магазин Ільфа та Петрова" },
  { id: "br4", name: "108 - Магазин Раскідайловська" },
];

const productGroups = [
  { id: "100", name: "100 - MIXON - Car Refinish" },
  { id: "201", name: "201 - MIXON - Деревозахисні" },
  { id: "301", name: "301 - NOVOTEX" },
  { id: "401", name: "401 - SOUDAL" },
  { id: "501", name: "501 - CERESIT" },
];

const discountProfiles = [
  {
    id: "smallWholesale",
    label: "Малий опт",
    description: "Базові знижки для невеликих клієнтів",
    defaultDiscounts: [
      { groupId: "100", percent: 15 },
      { groupId: "201", percent: 7 },
      { groupId: "301", percent: 5 },
      { groupId: "401", percent: 6 },
    ],
  },
  {
    id: "wholesale",
    label: "Опт",
    description: "Стандартний оптовий прайс",
    defaultDiscounts: [
      { groupId: "100", percent: 20 },
      { groupId: "201", percent: 12 },
      { groupId: "301", percent: 10 },
      { groupId: "401", percent: 9 },
      { groupId: "501", percent: 8 },
    ],
  },
  {
    id: "largeWholesale",
    label: "Великий опт",
    description: "Максимально доступні знижки",
    defaultDiscounts: [
      { groupId: "100", percent: 28 },
      { groupId: "201", percent: 20 },
      { groupId: "301", percent: 18 },
      { groupId: "401", percent: 16 },
      { groupId: "501", percent: 15 },
    ],
  },
];

const defaultUsers = [
  {
    id: 536,
    name: "Рахор Рах",
    email: "vrazgermktrdylan001@gmail.com",
    company: "Rasmussen and Gomez Plc",
    location: "Україна, Київ",
    phone: "+38 (097) 939-2758",
    role: "manager",
    shippingPoint: "br1",
    discountType: "wholesale",
    defaultDiscounts: discountProfiles[1].defaultDiscounts,
    specialDiscounts: [
      { groupId: "401", percent: 12 },
    ],
    accessCategories: ["100", "201", "401"],
    registrationDate: "2025-10-25",
    lastContact:
      "Очікує відповіді клієнта щодо доступу до товарів групи 401",
    isNew: false,
  },
  {
    id: 537,
    name: "Масленко Вячеслав",
    email: "v.maslianko@mixon.ua",
    company: "ТОВ Мікс Ін.",
    location: "Україна, Одеса",
    phone: "+38 (067) 215-1150",
    role: "user",
    shippingPoint: "br3",
    discountType: "smallWholesale",
    defaultDiscounts: discountProfiles[0].defaultDiscounts,
    specialDiscounts: [],
    accessCategories: ["100", "201"],
    registrationDate: "2025-10-27",
    lastContact: "Потрібне підтвердження актуальності контактів",
    isNew: true,
  },
  {
    id: 538,
    name: "Шевченко Алёна",
    email: "zakaz@mixon.ua",
    company: "Мікс",
    location: "Україна, Харків",
    phone: "+38 (067) 924-0775",
    role: "admin",
    shippingPoint: "br2",
    discountType: "largeWholesale",
    defaultDiscounts: discountProfiles[2].defaultDiscounts,
    specialDiscounts: [
      { groupId: "201", percent: 25 },
    ],
    accessCategories: ["all"],
    registrationDate: "2025-10-20",
    lastContact: "Призначено адміністратором 24.10",
    isNew: false,
  },
  {
    id: 539,
    name: "Митьяй Володимир",
    email: "intmix@mixon.ua",
    company: "ООП Мітія В.А.",
    location: "Україна, Умань",
    phone: "+38 (067) 489-1901",
    role: null,
    shippingPoint: null,
    discountType: null,
    defaultDiscounts: [],
    specialDiscounts: [],
    accessCategories: [],
    registrationDate: "2025-10-29",
    lastContact: "Необхідно зателефонувати клієнту",
    isNew: true,
  },
];

const roleOptions = [
  { value: "user", label: "Користувач" },
  { value: "manager", label: "Менеджер" },
  { value: "admin", label: "Адміністратор" },
];

function resolveDiscountProfile(id) {
  return discountProfiles.find((profile) => profile.id === id) || null;
}

function resolveGroupName(id) {
  if (id === "all") {
    return "Всі групи";
  }
  const group = productGroups.find((item) => item.id === id);
  return group ? group.name : id;
}

export default function AdminUsers() {
  const [users, setUsers] = useState(defaultUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formState, setFormState] = useState(null);
  const [specialDraft, setSpecialDraft] = useState({ groupId: "", percent: "" });

  const newRegistrations = useMemo(
    () => users.filter((user) => user.isNew).length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(lower) ||
        user.email.toLowerCase().includes(lower) ||
        (user.company && user.company.toLowerCase().includes(lower)) ||
        String(user.id).includes(lower)
      );
    });
  }, [users, searchTerm]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  useEffect(() => {
    if (selectedUser) {
      setFormState({
        role: selectedUser.role,
        shippingPoint: selectedUser.shippingPoint,
        discountType: selectedUser.discountType,
        defaultDiscounts: selectedUser.defaultDiscounts || [],
        specialDiscounts: selectedUser.specialDiscounts || [],
        accessCategories: selectedUser.accessCategories || [],
        lastContact: selectedUser.lastContact || "",
      });
      setSpecialDraft({ groupId: "", percent: "" });
    }
  }, [selectedUserId, selectedUser]);

  const openUserPanel = (userId) => {
    setSelectedUserId(userId);
    setIsPanelOpen(true);
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isNew: false } : user
      )
    );
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedUserId(null);
    setFormState(null);
  };

  const handleRoleChange = (value) => {
    setFormState((prev) => ({ ...prev, role: value }));
  };

  const handleShippingPointChange = (value) => {
    setFormState((prev) => ({ ...prev, shippingPoint: value }));
  };

  const handleDiscountTypeChange = (value) => {
    const profile = resolveDiscountProfile(value);
    setFormState((prev) => ({
      ...prev,
      discountType: value,
      defaultDiscounts: profile ? profile.defaultDiscounts : [],
    }));
  };

  const handleToggleAccessCategory = (categoryId) => {
    setFormState((prev) => {
      if (!prev) return prev;
      let nextAccess;
      if (categoryId === "all") {
        nextAccess = prev.accessCategories.includes("all") ? [] : ["all"];
      } else {
        const withoutAll = prev.accessCategories.filter((id) => id !== "all");
        if (withoutAll.includes(categoryId)) {
          nextAccess = withoutAll.filter((id) => id !== categoryId);
        } else {
          nextAccess = [...withoutAll, categoryId];
        }
      }
      return { ...prev, accessCategories: nextAccess };
    });
  };

  const handleSpecialDraftChange = (field, value) => {
    setSpecialDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSpecialDiscount = () => {
    if (!specialDraft.groupId || specialDraft.percent === "") return;
    const percentValue = Number(specialDraft.percent);
    if (Number.isNaN(percentValue)) return;

    setFormState((prev) => {
      if (!prev) return prev;
      const existingIndex = prev.specialDiscounts.findIndex(
        (item) => item.groupId === specialDraft.groupId
      );
      let updatedSpecials;
      if (existingIndex >= 0) {
        updatedSpecials = [...prev.specialDiscounts];
        updatedSpecials[existingIndex] = {
          groupId: specialDraft.groupId,
          percent: percentValue,
        };
      } else {
        updatedSpecials = [
          ...prev.specialDiscounts,
          { groupId: specialDraft.groupId, percent: percentValue },
        ];
      }
      return { ...prev, specialDiscounts: updatedSpecials };
    });

    setSpecialDraft({ groupId: "", percent: "" });
  };

  const handleRemoveSpecialDiscount = (groupId) => {
    setFormState((prev) => ({
      ...prev,
      specialDiscounts: prev.specialDiscounts.filter(
        (item) => item.groupId !== groupId
      ),
    }));
  };

  const handleLastContactChange = (value) => {
    setFormState((prev) => ({ ...prev, lastContact: value }));
  };

  const handleSave = () => {
    if (!selectedUserId || !formState) return;
    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedUserId
          ? {
              ...user,
              role: formState.role,
              shippingPoint: formState.shippingPoint,
              discountType: formState.discountType,
              defaultDiscounts: formState.defaultDiscounts,
              specialDiscounts: formState.specialDiscounts,
              accessCategories: formState.accessCategories,
              lastContact: formState.lastContact,
            }
          : user
      )
    );
    setIsPanelOpen(false);
  };

  return (
    <HomeLayout
      children={
        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <FaUserShield className="text-indigo-500" />
                  Управління користувачами
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-3xl">
                  Перегляд усіх нових реєстрацій, призначення ролей, торгових точок,
                  знижок та доступів до категорій. Після контакту з клієнтом
                  оновіть дані, аби команда бачила поточний статус.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg">
                  <FaBell />
                  <div>
                    <p className="text-xs uppercase tracking-wide">Нові заявки</p>
                    <p className="text-lg font-bold">
                      {newRegistrations}
                      <span className="text-sm font-medium text-indigo-500 ml-1">
                        очікують обробки
                      </span>
                    </p>
                  </div>
                </div>
                <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                  <FaUserPlus />
                  Додати вручну
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="search"
                  placeholder="Пошук за ім'ям, e-mail, компанією або номером ID"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{filteredUsers.length}</span>
                активних записів
              </div>
            </div>

            <div className="p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  Немає користувачів за вашим запитом.
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                          <tr>
                            <th className="px-4 py-3 text-left">ID</th>
                            <th className="px-4 py-3 text-left">Ім'я</th>
                            <th className="px-4 py-3 text-left">Пошта</th>
                            <th className="px-4 py-3 text-left">Компанія</th>
                            <th className="px-4 py-3 text-left">Місце</th>
                            <th className="px-4 py-3 text-left w-44">Телефон</th>
                            <th className="px-4 py-3 text-left">Роль</th>
                            <th className="px-4 py-3 text-left">Точка відвантаження</th>
                            <th className="px-4 py-3 text-left">Тип знижок</th>
                            <th className="px-4 py-3 text-left">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredUsers.map((user) => {
                            const shippingPoint = shippingPoints.find(
                              (point) => point.id === user.shippingPoint
                            );
                            const discountProfile = resolveDiscountProfile(
                              user.discountType
                            );
                            const roleLabel =
                              roleOptions.find((role) => role.value === user.role)?.label || "Не призначено";

                            return (
                              <tr key={user.id} className="hover:bg-indigo-50/40 transition">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {user.id}
                                  {user.isNew && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">
                                      <FaBell className="text-xs" />
                                      New
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-gray-900">{user.name}</div>
                                  <p className="text-xs text-gray-500">
                                    Зареєстровано {new Date(user.registrationDate).toLocaleDateString("uk-UA")}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                <td className="px-4 py-3 text-gray-600">{user.company || "—"}</td>
                                <td className="px-4 py-3 text-gray-600">{user.location || "—"}</td>
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap min-w-[11rem]">
                                  {user.phone || "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
                                    <FaUserShield />
                                    {roleLabel}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {shippingPoint ? shippingPoint.name : "Не призначено"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {discountProfile ? discountProfile.label : "Не призначено"}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => openUserPanel(user.id)}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                                  >
                                    Керувати
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="md:hidden">
                    <div className="grid gap-4">
                      {filteredUsers.map((user) => {
                        const shippingPoint = shippingPoints.find(
                          (point) => point.id === user.shippingPoint
                        );
                        const discountProfile = resolveDiscountProfile(
                          user.discountType
                        );
                        const roleLabel =
                          roleOptions.find((role) => role.value === user.role)?.label || "Не призначено";
                        const accessLabels = user.accessCategories.includes("all")
                          ? ["Всі групи"]
                          : user.accessCategories.map((categoryId) =>
                              resolveGroupName(categoryId)
                            );

                        return (
                          <article
                            key={`${user.id}-mobile`}
                            className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition flex flex-col gap-4 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">ID</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold text-gray-900">
                                    {user.id}
                                  </span>
                                  {user.isNew && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">
                                      <FaBell className="text-xs" />
                                      New
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => openUserPanel(user.id)}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                              >
                                Керувати
                              </button>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Зареєстровано {new Date(user.registrationDate).toLocaleDateString("uk-UA")}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Пошта</p>
                                <p className="text-gray-900 break-words">{user.email}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Компанія</p>
                                <p className="text-gray-900">{user.company || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide текст-gray-500">Місце</p>
                                <p className="text-gray-900">{user.location || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Телефон</p>
                                <p className="text-gray-900">{user.phone || "—"}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                                <FaUserShield />
                                {roleLabel}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                <FaTruck className="text-gray-500" />
                                {shippingPoint ? shippingPoint.name : "Точка не призначена"}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                <FaPercent className="text-gray-500" />
                                {discountProfile ? discountProfile.label : "Знижки не призначено"}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Останній контакт</p>
                                <p className="text-gray-900">{user.lastContact || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Доступ до категорій</p>
                                {accessLabels.length === 0 ? (
                                  <p className="text-gray-900">—</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {accessLabels.map((label) => (
                                      <span
                                        key={label}
                                        className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {isPanelOpen && selectedUser && formState && (
            <div className="fixed inset-0 z-40 flex items-end md:items-stretch justify-end">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={closePanel}
                aria-hidden="true"
              ></div>
              <div className="relative w-full md:max-w-xl bg-white h-full md:h-auto md:min-h-full shadow-2xl overflow-y-auto">
                <header className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <FaUserShield className="text-indigo-500" />
                      Картка клієнта #{selectedUser.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Останній контакт: {selectedUser.lastContact || "не вказано"}
                    </p>
                  </div>
                  <button
                    onClick={closePanel}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Закрити"
                  >
                    <FaTimes size={18} />
                  </button>
                </header>

                <div className="px-6 py-6 space-y-6">
                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaUserShield className="text-indigo-500" />
                      Роль користувача
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {roleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleRoleChange(option.value)}
                          className={`border rounded-lg px-3 py-2 text-sm font-medium flex flex-col gap-1 transition ${
                            formState.role === option.value
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className="text-xs text-gray-500 font-normal">
                            {option.value === "user" && "Бачить лише власну точку"}
                            {option.value === "manager" && "Доступ до всіх складів"}
                            {option.value === "admin" && "Повний доступ до адмінки"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaTruck className="text-indigo-500" />
                      Точка відвантаження
                    </h4>
                    <div className="space-y-3">
                      {shippingPoints.map((point) => (
                        <label
                          key={point.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                            formState.shippingPoint === point.id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shippingPoint"
                            value={point.id}
                            checked={formState.shippingPoint === point.id}
                            onChange={() => handleShippingPointChange(point.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{point.name}</p>
                            <p className="text-xs text-gray-500">
                              Клієнт бачитиме залишки саме для цієї точки
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaPercent className="text-indigo-500" />
                      Тип знижок
                    </h4>
                    <div className="space-y-3">
                      {discountProfiles.map((profile) => (
                        <label
                          key={profile.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                            formState.discountType === profile.id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="discountProfile"
                            value={profile.id}
                            checked={formState.discountType === profile.id}
                            onChange={() => handleDiscountTypeChange(profile.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{profile.label}</p>
                            <p className="text-xs text-gray-500">{profile.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {profile.defaultDiscounts.map((discount) => (
                                <span
                                  key={discount.groupId}
                                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                                >
                                  <FaLayerGroup className="text-gray-400" />
                                  <span>{discount.groupId}</span>
                                  <span className="font-semibold text-gray-900">
                                    {discount.percent}%
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaPercent className="text-indigo-500" />
                      Спеціальні знижки за категоріями
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={specialDraft.groupId}
                          onChange={(event) =>
                            handleSpecialDraftChange("groupId", event.target.value)
                          }
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Оберіть групу товарів</option>
                          {productGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        <input
                          value={specialDraft.percent}
                          onChange={(event) =>
                            handleSpecialDraftChange("percent", event.target.value)
                          }
                          type="number"
                          min="0"
                          max="100"
                          placeholder="%"
                          className="w-full sm:w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleAddSpecialDiscount}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                        >
                          Додати
                        </button>
                      </div>

                      <div className="space-y-2">
                        {formState.specialDiscounts.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Поки що спеціальних знижок немає. Додайте першу, щоб
                            перевизначити значення з обраного типу оптової знижки.
                          </p>
                        )}
                        {formState.specialDiscounts.map((entry) => (
                          <div
                            key={entry.groupId}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {resolveGroupName(entry.groupId)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Нова знижка: {entry.percent}%
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveSpecialDiscount(entry.groupId)}
                              className="text-sm text-red-500 hover:text-red-600 font-semibold"
                            >
                              Видалити
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaEye className="text-indigo-500" />
                      Доступ до залишків за категоріями
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition ${
                          formState.accessCategories.includes("all")
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formState.accessCategories.includes("all")}
                          onChange={() => handleToggleAccessCategory("all")}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          Всі групи
                        </span>
                      </label>
                      {productGroups.map((group) => (
                        <label
                          key={group.id}
                          className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition ${
                            formState.accessCategories.includes("all") ||
                            formState.accessCategories.includes(group.id)
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              formState.accessCategories.includes("all") ||
                              formState.accessCategories.includes(group.id)
                            }
                            onChange={() => handleToggleAccessCategory(group.id)}
                            disabled={formState.accessCategories.includes("all")}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {group.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      Нотатка про статус комунікації
                    </h4>
                    <textarea
                      value={formState.lastContact}
                      onChange={(event) => handleLastContactChange(event.target.value)}
                      rows={3}
                      placeholder="Опишіть результати останньої розмови, що потрібно зробити далі, хто відповідальний"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </section>
                </div>

                <footer className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={closePanel}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <FaSave />
                    Зберегти зміни
                  </button>
                </footer>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
