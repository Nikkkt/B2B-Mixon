import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/home");
  };

  useEffect(() => {
    if (location.state?.fromRegistration) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);

      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <AuthLayout
      title="Вхід в особистий кабінет"
      footer={
        <>
          Немає акаунта?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Зареєструватися
          </a>
        </>
      }
    >
      {showSuccessMessage && (
        <div
          className="fixed top-0 left-0 w-full bg-green-100 text-green-700 border-b border-green-400 p-3 transform transition-transform duration-500 ease-in-out"
          style={{ transform: showSuccessMessage ? "translateY(0)" : "translateY(-100%)" }}
        >
          Вітаємо! Ваш аккаунт успішно підтверджено. Тепер ви можете увійти.
        </div>
      )}
      <form className="space-y-4 mt-16" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Пошта"
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          placeholder="Пароль"
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span></span>
          <a href="/password-reset" className="text-blue-600 hover:underline">
            Забули пароль?
          </a>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700"
        >
          Увійти
        </button>
      </form>
    </AuthLayout>
  );
}