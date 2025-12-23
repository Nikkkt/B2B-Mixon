import { Outlet, useLocation, Link, useNavigate } from "react-router-dom"; // <-- Додано Link
import { 
  FaShoppingCart, FaBarcode, FaEye, FaList, FaHome, FaRegUser, 
  FaCode, FaUpload, FaUsers, FaBuilding, FaMapMarkerAlt, FaLayerGroup, 
  FaUserCircle, FaShoppingBag, FaSignOutAlt, FaBars, FaTimes, FaHistory,
  FaFileUpload
} from "react-icons/fa";
import { useState } from "react";
import logo from "../assets/logo.png";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import CartDrawer from "./cart/CartDrawer.jsx";

const resolveRole = (role) => {
  if (typeof role === "string") {
    return role.toLowerCase();
  }

  if (typeof role === "number") {
    switch (role) {
      case 3:
        return "department";
      case 2:
        return "admin";
      case 1:
        return "manager";
      default:
        return "user";
    }
  }

  if (role && typeof role === "object" && "name" in role) {
    return String(role.name).toLowerCase();
  }

  return null;
};

export default function HomeLayout({children}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // <-- Новий стан для сайдбару
  const { totalQuantity, toggleDrawer, clearCart, setComment, setOrderType, setPaymentMethod } = useCart();
  const { user, logout } = useAuth();
  const userRole = resolveRole(user?.role);
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map(resolveRole).filter(Boolean)
    : [];
  const hasAdminRole = userRole === "admin" || userRoles.includes("admin");
  const hasDepartmentRole = userRole === "department" || userRoles.includes("department");

  const getPageTitle = () => {
    // ... (функція getPageTitle залишається без змін) ...
    switch (location.pathname) {
      case "/home": return "Головна - Онлайн замовлення";
      case "/orders": return "Замовлення товарів";
      case "/orders-by-code": return "Замовлення по кодах";
      case "/view-availability": return "Перегляд наявності";
      case "/view-availability-by-group": return "Перегляд наявності по групах";
      case "/view-availability-by-code": return "Перегляд наявності по коду";
      case "/upload-products": return "Завантаження товарів";
      case "/users": return "Користувачі";
      case "/departments": return "Відділи";
      case "/directions": return "Направлення";
      case "/product-groups": return "Групи товарів";
      default: return "Онлайн замовлення";
    }
  };

  const handleLogout = () => {
    clearCart();
    setComment("");
    setOrderType("Текущий");
    setPaymentMethod("Наличный");
    logout();
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
    navigate("/login", { replace: true });
  };

  const closeMobileSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 relative min-w-0">
        
        {/* Оверлей для закриття мобільного меню */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 z-10 md:hidden"
            onClick={closeMobileSidebar}
          ></div>
        )}

        {/* --- ОНОВЛЕНА Бічна панель --- */}
        <aside 
          className={`w-64 bg-gray-900 text-white p-4 
                     fixed h-full z-20 
                     transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                     transition-transform duration-300 ease-in-out 
                     md:sticky md:top-0 md:h-screen md:translate-x-0`}
        >
          <div className="mb-6 mt-6 flex justify-between items-center">
            <img src={logo} alt="Logo" className="h-18 w-auto" />
            {/* Кнопка закриття (хрестик) для мобілок */}
            <button className="text-white text-2xl md:hidden" onClick={closeMobileSidebar}>
              <FaTimes />
            </button>
          </div>
          
          <nav>
            <h3 className="mt-4 mb-4 text-xs font-semibold text-gray-400 uppercase">Акаунт</h3>
            {/* --- Посилання замінено на <Link> --- */}
            <ul className="space-y-1 mb-4">
              <li><Link to="/orders" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaShoppingCart className="mr-2" />Замовлення товарів</Link></li>
              <li><Link to="/orders-by-code" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaBarcode className="mr-2" />Замовлення по кодах</Link></li>
              <li><Link to="/view-availability" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaEye className="mr-2" />Перегляд наявності</Link></li>
              <li><Link to="/view-availability-by-group" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaList className="mr-2" />Перегляд наявності по групах</Link></li>
              <li><Link to="/view-availability-by-code" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaCode className="mr-2" />Перегляд наявності по коду</Link></li>
              {(hasAdminRole || hasDepartmentRole) && (
                <li><Link to="/availability-download" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaFileUpload className="mr-2" />Завантаження наявності</Link></li>
              )}
              <li><Link to="/order-history" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaHistory className="mr-2" />Історія замовлень</Link></li>
            </ul>

            {hasAdminRole && (
              <>
                <hr className="border-gray-700 my-2" />
                <h3 className="mt-4 mb-4 text-xs font-semibold text-gray-400 uppercase">Адмін</h3>
                <ul className="space-y-1">
                  <li><Link to="/upload-products" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaUpload className="mr-2" />Завантаження товарів</Link></li>
                  <li><Link to="/users" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaUsers className="mr-2" />Користувачі</Link></li>
                  <li><Link to="/departments" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaBuilding className="mr-2" />Відділи</Link></li>
                  <li><Link to="/directions" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaMapMarkerAlt className="mr-2" />Направлення</Link></li>
                  <li><Link to="/product-groups" onClick={closeMobileSidebar} className="flex items-center p-1 text-sm hover:bg-gray-700 rounded"><FaLayerGroup className="mr-2" />Групи товарів</Link></li>
                </ul>
              </>
            )}
          </nav>
        </aside>

        {/* --- ОНОВЛЕНА Основна область --- */}
        <div className="flex-1 flex flex-col w-full md:w-auto min-w-0">
          <header className="bg-gray-800 text-white p-4 flex justify-between items-center relative">
            
            {/* --- Нова "Гамбургер" кнопка --- */}
            <button 
              className="text-white text-2xl md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FaBars />
            </button>

            <h1 className="text-lg font-bold text-center md:text-left flex-1">{getPageTitle()}</h1>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={toggleDrawer}
                aria-label="Відкрити корзину"
              >
                <FaShoppingCart />
                <span>Корзина</span>
                {totalQuantity > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalQuantity}
                  </span>
                )}
              </button>

              <div className="relative">
                <FaUserCircle
                  className="text-2xl cursor-pointer"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                />
                {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 border border-gray-300 rounded shadow-lg z-30"> {/* Збільшено z-index */}
                  <Link to="/home" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100 flex items-center"><FaHome className="mr-2" />Головна</Link>
                  <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100 flex items-center"><FaRegUser className="mr-2" />Профіль</Link>
                  <Link to="/cart" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-100 flex items-center"><FaShoppingBag className="mr-2" />Корзина</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"><FaSignOutAlt className="mr-2" />Вийти</button>
                </div>
              )}
              </div>
            </div>
          </header>

          {/* <main> тепер має flex-col, щоб Orders.jsx міг коректно розтягуватись */}
          <main className="flex-1 p-4 md:p-6 bg-gray-100 flex flex-col min-w-0 overflow-x-hidden">
            {children}
          </main>

          <CartDrawer />
          
          <footer className="bg-gray-800 text-white p-4 text-center text-sm">
            2025 Mixon <br/>
            Made by <a href="https://github.com/Nikkkt" className="text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer">Nikita Terpilovskyi</a>
          </footer>
        </div>
      </div>
    </div>
  );
}