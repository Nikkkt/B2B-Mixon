import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCamera, FaRegSave, FaUndo } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import { useCart } from "../context/CartContext.jsx";

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "ukrainian", label: "Українська" },
  { value: "russian", label: "Русский" },
];

const DEFAULT_FORM_STATE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  companyCode: "",
  country: "",
  city: "",
  address: "",
  fax: "",
  password: "",
  language: "ukrainian",
  avatarUrl: "",
};

export default function Profile() {
  const { currentUser, updateUserProfile } = useCart();
  const [formValues, setFormValues] = useState(() => ({
    ...DEFAULT_FORM_STATE,
    ...currentUser,
  }));
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || "");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setFormValues({
      ...DEFAULT_FORM_STATE,
      ...currentUser,
    });
    setAvatarPreview(currentUser?.avatarUrl || "");
    setStatus(null);
  }, [currentUser]);

  const fullName = useMemo(() => {
    const full = [formValues.firstName, formValues.lastName]
      .map((value) => (value || "").trim())
      .filter(Boolean)
      .join(" ");
    return full || "Ваш профіль";
  }, [formValues.firstName, formValues.lastName]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
      setFormValues((prev) => ({
        ...prev,
        avatarUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateUserProfile({ ...formValues, avatarUrl: avatarPreview });
    setStatus({ type: "success", message: "Профіль успішно оновлено" });
  };

  const handleReset = () => {
    setFormValues({
      ...DEFAULT_FORM_STATE,
      ...currentUser,
    });
    setAvatarPreview(currentUser?.avatarUrl || "");
    setStatus(null);
  };

  return (
    <HomeLayout>
      <div className="flex flex-col gap-6">
        <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex flex-wrap gap-2 items-center">
            <li>
              <Link to="/home" className="text-blue-600 hover:underline">
                Головна
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700">Профіль</li>
          </ol>
        </nav>

        <section className="bg-white rounded-xl shadow-md border border-gray-200">
          <header className="px-6 py-5 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Профіль користувача</h1>
              <p className="text-sm text-gray-500 mt-1">
                Оновіть свої контактні дані, щоб менеджери могли швидше обробляти замовлення.
              </p>
            </div>
            {status ? (
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  status.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                }`}
              >
                {status.message}
              </div>
            ) : null}
          </header>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-1/3">
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center text-center gap-4">
                  <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Аватар" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-400">{fullName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
                    <p className="text-sm text-gray-500">{formValues.company || "Компанія не вказана"}</p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-50 transition text-sm font-medium">
                    <FaCamera />
                    Завантажити фото
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>

              <div className="w-full lg:w-2/3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Ім'я *</span>
                    <input
                      name="firstName"
                      value={formValues.firstName}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Введіть ім'я"
                      required
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Прізвище *</span>
                    <input
                      name="lastName"
                      value={formValues.lastName}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Введіть прізвище"
                      required
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Email *</span>
                    <input
                      type="email"
                      name="email"
                      value={formValues.email}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="name@example.com"
                      required
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Телефон</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formValues.phone}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+380 67 000 00 00"
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Компанія</span>
                    <input
                      name="company"
                      value={formValues.company}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Назва компанії"
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Код ОКПО</span>
                    <input
                      name="companyCode"
                      value={formValues.companyCode}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="11111111"
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Країна</span>
                    <input
                      name="country"
                      value={formValues.country}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Україна"
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Місто</span>
                    <input
                      name="city"
                      value={formValues.city}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Одеса"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col text-sm gap-1 md:col-span-2">
                    <span className="font-medium text-gray-700">Адреса</span>
                    <input
                      name="address"
                      value={formValues.address}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Вулиця, будинок, офіс"
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Факс</span>
                    <input
                      name="fax"
                      value={formValues.fax}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+380 48 765 43 21"
                    />
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Мова інтерфейсу</span>
                    <select
                      name="language"
                      value={formValues.language}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col text-sm gap-1">
                    <span className="font-medium text-gray-700">Пароль</span>
                    <input
                      type="password"
                      name="password"
                      value={formValues.password}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Оновити пароль"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <Link
                to="/home"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Повернутись
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <FaUndo />
                Скасувати зміни
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <FaRegSave />
                Зберегти
              </button>
            </div>
          </form>
        </section>
      </div>
    </HomeLayout>
  );
}
