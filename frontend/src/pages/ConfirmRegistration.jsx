import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import AuthLayout from "../components/AuthLayout";
import { resendVerification, verifyEmail } from "../api/authApi";
import { useAuth } from "../context/AuthContext.jsx";

export default function ConfirmRegistration() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const inputRefs = useRef([]);
  const email = location.state?.email || "";

  const resetCodeInputs = () => {
    setCode(["", "", "", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      if (data?.token) {
        login({ token: data.token, tokenExpiresAt: data.tokenExpiresAt, user: data.user });
        navigate("/login", { state: { fromRegistration: true } });
      } else {
        setError("Не вдалося підтвердити код. Спробуйте ще раз.");
        resetCodeInputs();
      }
    },
    onError: (mutationError) => {
      setError(mutationError.message);
      resetCodeInputs();
    }
  });

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: (data) => {
      setInfoMessage(data?.message ?? "Новий код відправлено на вашу пошту.");
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    }
  });

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const nextCode = [...code];
      nextCode[index] = value;
      setCode(nextCode);

      if (value && index < nextCode.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const fullCode = code.join("");
    if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
      setError("Будь ласка, введіть 6-значний код");
      return;
    }

    verifyMutation.mutate({ email, code: fullCode });
  };

  const handleResend = () => {
    setError("");
    setInfoMessage("");
    resetCodeInputs();
    resendMutation.mutate(email);
  };

  return (
    <AuthLayout
      title="Підтвердження реєстрації"
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
        <p className="text-sm text-gray-600">
          Код надіслано на пошту <span className="font-semibold">{email}</span>
        </p>
        <div className="flex justify-between space-x-2">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(event) => handleCodeChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              ref={(element) => (inputRefs.current[index] = element)}
              className="w-12 h-12 text-center text-lg rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
              placeholder="-"
            />
          ))}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {infoMessage && <p className="text-green-600 text-sm">{infoMessage}</p>}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {verifyMutation.isPending ? "Перевірка..." : "Підтвердити код"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="w-full rounded-lg border border-blue-600 p-3 text-blue-600 text-sm sm:text-base transition hover:bg-blue-50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Надіслати ще раз
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}