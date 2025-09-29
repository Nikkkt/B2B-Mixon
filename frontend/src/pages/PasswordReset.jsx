import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setShowCodeInput(true);
      setError("");
    } else {
      setError("Будь ласка, введіть email");
    }
  };

  const handleCodeChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Автофокус на наступне поле
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length === 6 && /^\d{6}$/.test(fullCode)) {
      // Імітація перевірки коду
      // У реальному додатку тут буде запит до API
      navigate("/set-new-password");
    } else {
      setError("Будь ласка, введіть 6-значний код");
    }
  };

  useEffect(() => {
    if (showCodeInput) {
      inputRefs.current[0]?.focus();
    }
  }, [showCodeInput]);

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
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700"
          >
            Надіслати код
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
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
                className="w-12 h-12 text-center text-lg rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                placeholder="-"
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 p-3 text-white text-sm sm:text-base transition hover:bg-blue-700"
          >
            Підтвердити код
          </button>
        </form>
      )}
    </AuthLayout>
  );
}