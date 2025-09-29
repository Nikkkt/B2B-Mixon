import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

export default function SetNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Імітація зміни паролю
    // У реальному додатку тут буде запит до API
    if (password && confirmPassword) {
      if (password === confirmPassword) {
        navigate("/login");
      } else {
        setError("Паролі не співпадають");
      }
    } else {
      setError("Будь ласка, заповніть усі поля");
    }
  };

  return (
    <AuthLayout
      title="Новий пароль"
      footer={
        <>
          Повернутися до{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            входу
          </a>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Новий пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          placeholder="Підтвердження паролю"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700"
        >
          Змінити пароль
        </button>
      </form>
    </AuthLayout>
  );
}