import logo from "../assets/logo.png";

export default function AuthLayout({ title, children, footer, maxWidthClass = "max-w-md" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-0 to-blue-200 px-4">
      <div className={`w-full ${maxWidthClass} rounded-2xl bg-white p-6 m-6 shadow-xl`}>
        {/* Лого */}
        <div className="mb-6 mt-6 flex justify-center">
          <img src={logo} alt="Logo" className="h-18 w-auto" />
        </div>

        {/* Заголовок */}
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          {title}
        </h2>

        {/* Контент */}
        {children}

        {/* Нижній блок */}
        <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>
      </div>
    </div>
  );
}
