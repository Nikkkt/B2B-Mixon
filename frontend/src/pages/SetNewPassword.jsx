import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import AuthLayout from "../components/AuthLayout";
import { resetPassword } from "../api/authApi";

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

export default function SetNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email ?? "";
  const code = location.state?.code ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const passwordChecks = useMemo(() =>
    PASSWORD_RULES.map((rule) => ({ ...rule, isMet: rule.test(password) })),
  [password]);

  if (!email || !code) {
    navigate("/password-reset");
  }

  const passwordsMatch = password && password === confirmPassword;

  const { mutate, isPending } = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      navigate("/login", { state: { fromPasswordReset: true } });
    },
    onError: (error) => {
      setFormError(error.message);
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    if (!passwordsMatch) {
      setFormError("Паролі не співпадають");
      return;
    }

    mutate({ email, code, newPassword: password, confirmPassword });
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
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Новий пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          <ul className="space-y-1 text-xs text-gray-600">
            {passwordChecks.map((rule) => (
              <li key={rule.id} className="flex items-center gap-2">
                <span
                  className={
                    "inline-flex h-4 w-4 items-center justify-center rounded-full border " +
                    (rule.isMet ? "border-green-500 bg-green-500" : "border-gray-300")
                  }
                >
                  {rule.isMet && <span className="text-white text-[10px]">✓</span>}
                </span>
                {rule.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <input
            type="password"
            placeholder="Підтвердження паролю"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-500 mt-1">Паролі не співпадають</p>
          )}
        </div>
        {formError && <p className="text-red-500 text-sm">{formError}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? "Зміна..." : "Змінити пароль"}
        </button>
      </form>
    </AuthLayout>
  );
}