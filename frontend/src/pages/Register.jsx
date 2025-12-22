import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import AuthLayout from "../components/AuthLayout";
import { register as registerRequest } from "../api/authApi";

const PASSWORD_RULES = [
  {
    id: "length",
    label: "Мінімум 8 символів",
    test: (value) => value.length >= 8
  },
  {
    id: "upper",
    label: "Має містити велику літеру",
    test: (value) => /[A-ZА-ЯЇІЄҐ]/.test(value)
  },
  {
    id: "digit",
    label: "Має містити цифру",
    test: (value) => /\d/.test(value)
  },
  {
    id: "special",
    label: "Має містити спецсимвол",
    test: (value) => /[^A-Za-zА-Яа-яЇїІіЄєҐґ0-9]/.test(value)
  }
];

const COUNTRY_OPTIONS = [
  "Україна",
  "Польща",
  "Німеччина",
  "Франція",
  "Італія",
  "Іспанія",
  "Нідерланди",
  "Бельгія",
  "Чехія",
  "Словаччина",
  "Австрія",
  "Угорщина",
  "Румунія",
  "Болгарія",
  "Литва",
  "Латвія",
  "Естонія",
  "Велика Британія",
  "США",
  "Канада",
  "Інше",
];

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    company: "",
    country: "Україна",
    city: "",
    address: "",
    phone: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  const passwordChecks = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      isMet: rule.test(form.password)
    }));
  }, [form.password]);

  const passwordsMatch = form.password && form.password === form.confirmPassword;

  const { mutate, isPending } = useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      if (data?.success) {
        navigate("/confirm-registration", { state: { email: form.email } });
      } else {
        setFormError(data?.message ?? "Не вдалося зареєструватися. Спробуйте ще раз.");
      }
    },
    onError: (error) => {
      setFormError(error.message);
    }
  });

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    if (!passwordsMatch) {
      setFormError("Паролі не співпадають");
      return;
    }

    const payload = {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      company: form.company.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim()
    };

    mutate(payload);
  };

  return (
    <AuthLayout
      title="Реєстрація"
      maxWidthClass="max-w-2xl"
      footer={
        <>
          Вже є акаунт?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Увійти
          </a>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Ім'я"
            value={form.firstName}
            onChange={handleChange("firstName")}
            required
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Прізвище"
            value={form.lastName}
            onChange={handleChange("lastName")}
            required
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <input
          type="email"
          placeholder="Пошта"
          value={form.email}
          onChange={handleChange("email")}
          autoComplete="email"
          required
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                value={form.password}
                onChange={handleChange("password")}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 p-3 pr-12 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Підтвердження паролю"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 pr-12 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Приховати пароль" : "Показати пароль"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {form.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">Паролі не співпадають</p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-[14px] text-gray-600">
            <ul className="space-y-1">
              {passwordChecks.map((rule) => (
                <li key={rule.id} className="flex items-center gap-1">
                  <span
                    className={
                      "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border " +
                      (rule.isMet ? "border-green-500 bg-green-500" : "border-gray-300")
                    }
                  >
                    {rule.isMet && <span className="text-white text-[8px]">✓</span>}
                  </span>
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <input
          type="text"
          placeholder="Підприємство"
          value={form.company}
          onChange={handleChange("company")}
          required
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={form.country}
            onChange={handleChange("country")}
            required
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Оберіть країну</option>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Місто"
            value={form.city}
            onChange={handleChange("city")}
            required
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <input
          type="text"
          placeholder="Адреса"
          value={form.address}
          onChange={handleChange("address")}
          required
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="tel"
          placeholder="Телефон"
          value={form.phone}
          onChange={handleChange("phone")}
          required
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        {formError && <p className="text-red-500 text-sm">{formError}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? "Реєстрація..." : "Зареєструватися"}
        </button>
      </form>
    </AuthLayout>
  );
}