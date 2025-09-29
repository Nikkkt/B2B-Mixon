import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("Україна");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Імітація відправки даних на сервер
    // У реальному додатку тут буде запит до API
    if (
      email &&
      firstName &&
      lastName &&
      password &&
      confirmPassword &&
      company &&
      country &&
      city &&
      address &&
      phone
    ) {
      if (password === confirmPassword) {
        navigate("/confirm-registration", { state: { email } });
      } else {
        setError("Паролі не співпадають");
      }
    } else {
      setError("Будь ласка, заповніть усі поля");
    }
  };

  return (
    <AuthLayout
      title="Реєстрація"
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
        {/* Ім'я + Прізвище */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Ім'я"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Прізвище"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Пошта */}
        <input
          type="email"
          placeholder="Пошта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        {/* Пароль + підтвердження */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Підтвердження паролю"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Підприємство */}
        <input
          type="text"
          placeholder="Підприємство"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        {/* Країна + місто */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Країна"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Місто"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Адреса */}
        <input
          type="text"
          placeholder="Адреса"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        {/* Телефон */}
        <input
          type="tel"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700"
        >
          Зареєструватися
        </button>
      </form>
    </AuthLayout>
  );
}