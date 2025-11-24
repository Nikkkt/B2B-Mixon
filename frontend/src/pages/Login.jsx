import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import AuthLayout from "../components/AuthLayout";
import { login as loginRequest } from "../api/authApi";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { mutate, isPending } = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if (data?.token) {
        const normalizedEmail = email.trim();
        login({
          token: data.token,
          tokenExpiresAt: data.tokenExpiresAt,
          user: data.user
        });
        if (
          password &&
          typeof navigator !== "undefined" &&
          "credentials" in navigator
        ) {
          const credentialPayload = {
            id: normalizedEmail,
            password,
            name: data?.user?.firstName ? `${data.user.firstName} ${data.user.lastName ?? ""}`.trim() : normalizedEmail
          };

          Promise.resolve()
            .then(() => {
              if (navigator.credentials.create) {
                return navigator.credentials
                  .create({ password: credentialPayload })
                  .then((credential) => {
                    if (credential) {
                      return navigator.credentials.store(credential);
                    }
                    return null;
                  });
              }

              if (typeof window !== "undefined" && "PasswordCredential" in window) {
                const credential = new window.PasswordCredential(credentialPayload);
                return navigator.credentials.store(credential);
              }

              return null;
            })
            .catch(() => {
              // Ignore storage errors – browser or context may not support the Credential Management API
            });
        }
        navigate("/home");
      } else {
        setFormError("Не вдалося отримати токен авторизації. Спробуйте ще раз.");
      }
    },
    onError: (error) => {
      setFormError(error.message);
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");
    mutate({ email: email.trim(), password });
  };

  useEffect(() => {
    if (location.state?.fromRegistration) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

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
        <div className="fixed top-0 left-0 w-full bg-green-100 text-green-700 border-b border-green-400 p-3">
          Вітаємо! Ваш аккаунт успішно підтверджено. Тепер ви можете увійти.
        </div>
      )}

      <form className="space-y-4 mt-16" onSubmit={handleSubmit} autoComplete="on">
        <input
          type="email"
          name="email"
          autoComplete="username"
          placeholder="Пошта"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          required
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span></span>
          <a href="/password-reset" className="text-blue-600 hover:underline">
            Забули пароль?
          </a>
        </div>

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? "Вхід..." : "Увійти"}
        </button>
      </form>
    </AuthLayout>
  );
}