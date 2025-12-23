import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import AuthLayout from "../components/AuthLayout";
import {
  requestPasswordReset,
  verifyPasswordReset
} from "../api/authApi";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [formError, setFormError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const resetCodeInputs = () => {
    setCode(["", "", "", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  const requestResetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      setShowCodeInput(true);
      setInfoMessage(data?.message ?? "Код надіслано на ваш email.");
      setFormError("");
      resetCodeInputs();
    },
    onError: (error) => {
      setFormError(error.message);
    }
  });

  const verifyResetMutation = useMutation({
    mutationFn: verifyPasswordReset,
    onSuccess: () => {
      const fullCode = code.join("");
      navigate("/set-new-password", { state: { email, code: fullCode } });
    },
    onError: (error) => {
      setFormError(error.message);
      resetCodeInputs();
    }
  });

  useEffect(() => {
    if (showCodeInput) {
      inputRefs.current[0]?.focus();
    }
  }, [showCodeInput]);

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    setFormError("");
    setInfoMessage("");
    requestResetMutation.mutate(email.trim());
  };

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

  const handleCodeSubmit = (event) => {
    event.preventDefault();
    setFormError("");
    const fullCode = code.join("");

    if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
      setFormError("Будь ласка, введіть 6-значний код");
      return;
    }

    verifyResetMutation.mutate({ email, code: fullCode });
  };

  return (
    <AuthLayout
      title={showCodeInput ? "Введіть код" : "Відновлення паролю"}
      footer={
        <>
          Повернутися до{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            входу
          </a>
        </>
      }
    >
      {!showCodeInput ? (
        <form className="space-y-4" onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="Пошта"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          {infoMessage && <p className="text-green-600 text-sm">{infoMessage}</p>}
          <button
            type="submit"
            disabled={requestResetMutation.isPending}
            className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {requestResetMutation.isPending ? "Відправка..." : "Надіслати код"}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleCodeSubmit}>
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
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          {infoMessage && <p className="text-green-600 text-sm">{infoMessage}</p>}
          <button
            type="submit"
            disabled={verifyResetMutation.isPending}
            className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {verifyResetMutation.isPending ? "Перевірка..." : "Підтвердити код"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}