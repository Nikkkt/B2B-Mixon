import { Outlet, useLocation } from "react-router-dom";
import { FaShoppingCart, FaBarcode, FaEye, FaList, FaCode, FaUpload, FaUsers, FaBuilding, FaMapMarkerAlt, FaLayerGroup, FaUserCircle, FaShoppingBag, FaSignOutAlt } from "react-icons/fa";
import { useState } from "react";
import logo from "../assets/logo.png";

// Приклад контексту авторизації (замінити на реальну логіку)
const userRole = "admin"; // Наприклад, "user" або "admin"

export default function HomeLayout() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Визначення назви сторінки на основі маршруту
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/home":
        return "Замовлення товарів";
      case "/orders-by-code":
        return "Замовлення по кодах";
      case "/view-availability":
        return "Перегляд наявності";
      case "/view-availability-by-group":
        return "Перегляд наявності по групах";
      case "/view-availability-by-code":
        return "Перегляд наявності по коду";
      case "/upload-products":
        return "Завантаження товарів";
      case "/users":
        return "Користувачі";
      case "/departments":
        return "Відділи";
      case "/directions":
        return "Направлення";
      case "/product-groups":
        return "Групи товарів";
      default:
        return "Онлайн замовлення";
    }
  };

  const handleLogout = () => {
    // Імітація виходу з акаунту
    alert("Вихід з акаунту");
    // У реальному додатку тут буде логіка очищення токена та перенаправлення
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1">
        {/* Бічна панель */}
        <aside className="w-64 bg-gray-900 text-white p-4">
          <div className="mb-6 mt-6 flex justify-center">
            <img src={logo} alt="Logo" className="h-18 w-auto" />
          </div>
          <nav>
            <h3 className="mt-4 mb-4 text-xs font-semibold text-gray-400 uppercase">Акаунт</h3>
            <ul className="space-y-1 mb-4">
              <li><a href="/home" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaShoppingCart className="mr-2" />Замовлення товарів</a></li>
              <li><a href="/orders-by-code" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaBarcode className="mr-2" />Замовлення по кодах</a></li>
              <li><a href="/view-availability" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaEye className="mr-2" />Перегляд наявності</a></li>
              <li><a href="/view-availability-by-group" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaList className="mr-2" />Перегляд наявності по групах</a></li>
              <li><a href="/view-availability-by-code" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaCode className="mr-2" />Перегляд наявності по коду</a></li>
            </ul>

            {userRole === "admin" && (
              <>
                <hr className="border-gray-700 my-2" />
                <h3 className="mt-4 mb-4 text-xs font-semibold text-gray-400 uppercase">Адмін</h3>
                <ul className="space-y-1">
                  <li><a href="/upload-products" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaUpload className="mr-2" />Завантаження товарів</a></li>
                  <li><a href="/users" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaUsers className="mr-2" />Користувачі</a></li>
                  <li><a href="/departments" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaBuilding className="mr-2" />Відділи</a></li>
                  <li><a href="/directions" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaMapMarkerAlt className="mr-2" />Направлення</a></li>
                  <li><a href="/product-groups" className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaLayerGroup className="mr-2" />Групи товарів</a></li>
                </ul>
              </>
            )}
          </nav>
        </aside>

        {/* Основна область із хедером, вмістом і футером */}
        <div className="flex-1 flex flex-col">
          <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h1 className="text-lg font-bold">{getPageTitle()}</h1>
            <div className="relative">
              <FaUserCircle
                className="text-2xl cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 border border-gray-300 rounded shadow-lg z-10">
                  <a href="/profile" className="block px-4 py-2 hover:bg-gray-100">Профіль</a>
                  <a href="/edit-profile" className="block px-4 py-2 hover:bg-gray-100">Редагувати профіль</a>
                  <a href="/cart" className="block px-4 py-2 hover:bg-gray-100 flex items-center"><FaShoppingBag className="mr-2" />Корзина</a>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"><FaSignOutAlt className="mr-2" />Вийти</button>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 bg-gray-100">
            <Outlet />
          </main>
          <footer className="bg-gray-800 text-white p-4 text-center text-sm">
            2025 © <a href="https://github.com/Nikkkt" className="text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer">Nikita Terpilovskyi</a>
          </footer>
        </div>
      </div>
    </div>
  );
}