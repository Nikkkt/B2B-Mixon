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

const formatQuantity = (value) =>
  Number(value ?? 0).toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  });

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

  const navLinkClass =
    "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-200/80 hover:text-gray-900 hover:translate-x-1";
  const navIconClass =
    "flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors duration-200 group-hover:bg-gray-900 group-hover:text-white";

  const getPageTitle = () => {
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
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 z-10 md:hidden"
            onClick={closeMobileSidebar}
          ></div>
        )}

        <aside 
          className={`w-64 bg-gray-200 text-gray-900 p-4
                     fixed h-full z-20 
                     transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                     transition-transform duration-300 ease-in-out 
                     md:sticky md:top-0 md:h-screen md:translate-x-0`}
        >
          <div className="mb-6 mt-6 flex justify-between items-center">
            <img src={logo} alt="Logo" className="h-18 w-auto" />
            <button className="text-gray-900 text-2xl md:hidden" onClick={closeMobileSidebar}>
              <FaTimes />
            </button>
          </div>
          
          <nav>
            <h3 className="mt-4 mb-4 text-[11px] font-semibold tracking-[0.3em] text-gray-500 uppercase">
              Акаунт
            </h3>
            <ul className="space-y-2 mb-6">
              <li>
                <Link to="/orders" onClick={closeMobileSidebar} className={navLinkClass}>
                  <span className={navIconClass}><FaShoppingCart /></span>
                  <span>Замовлення товарів</span>
                </Link>
              </li>
              <li>
                <Link to="/orders-by-code" onClick={closeMobileSidebar} className={navLinkClass}>
                  <span className={navIconClass}><FaBarcode /></span>
                  <span>Замовлення по кодах</span>
                </Link>
              </li>
              <li>
                <Link to="/view-availability" onClick={closeMobileSidebar} className={navLinkClass}>
                  <span className={navIconClass}><FaEye /></span>
                  <span>Перегляд наявності</span>
                </Link>
              </li>
              <li>
                <Link to="/view-availability-by-group" onClick={closeMobileSidebar} className={navLinkClass}>
                  <span className={navIconClass}><FaList /></span>
                  <span>Перегляд наявності по групах</span>
                </Link>
              </li>
              <li>
                <Link to="/view-availability-by-code" onClick={closeMobileSidebar} className={navLinkClass}>
                  <span className={navIconClass}><FaCode /></span>
                  <span>Перегляд наявності по коду</span>
                </Link>
              </li>
              {(hasAdminRole || hasDepartmentRole) && (
                <li>
                  <Link to="/availability-download" onClick={closeMobileSidebar} className={navLinkClass}>
                    <span className={navIconClass}><FaFileUpload /></span>
                    <span>Завантаження наявності</span>
                  </Link>
                </li>
              )}
              <li>
                <Link to="/order-history" onClick={closeMobileSidebar} className={navLinkClass}>
                  <span className={navIconClass}><FaHistory /></span>
                  <span>Історія замовлень</span>
                </Link>
              </li>
            </ul>

            {hasAdminRole && (
              <>
                <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-gray-400/40 to-transparent" />
                <h3 className="mt-2 mb-4 text-[11px] font-semibold tracking-[0.3em] text-gray-500 uppercase">
                  Адмін
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/upload-products" onClick={closeMobileSidebar} className={navLinkClass}>
                      <span className={navIconClass}><FaUpload /></span>
                      <span>Завантаження товарів</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/users" onClick={closeMobileSidebar} className={navLinkClass}>
                      <span className={navIconClass}><FaUsers /></span>
                      <span>Користувачі</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/departments" onClick={closeMobileSidebar} className={navLinkClass}>
                      <span className={navIconClass}><FaBuilding /></span>
                      <span>Відділи</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/directions" onClick={closeMobileSidebar} className={navLinkClass}>
                      <span className={navIconClass}><FaMapMarkerAlt /></span>
                      <span>Направлення</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/product-groups" onClick={closeMobileSidebar} className={navLinkClass}>
                      <span className={navIconClass}><FaLayerGroup /></span>
                      <span>Групи товарів</span>
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col w-full md:w-auto min-w-0">
          <header className="bg-gray-300 text-gray-900 p-4 flex justify-between items-center relative shadow-sm">
            
            <button 
              className="text-gray-900 text-2xl md:hidden"
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
                    {formatQuantity(totalQuantity)}
                  </span>
                )}
              </button>

              <div className="relative text-gray-900">
                <FaUserCircle
                  className="text-2xl cursor-pointer transition-transform duration-200 hover:scale-110"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                />
                {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur z-30">
                  <Link to="/home" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                    <FaHome /> Головна
                  </Link>
                  <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                    <FaRegUser /> Профіль
                  </Link>
                  <Link to="/cart" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                    <FaShoppingBag /> Корзина
                  </Link>
                  <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-900 transition hover:bg-gray-100">
                    <FaSignOutAlt /> Вийти
                  </button>
                </div>
              )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 bg-gray-100 flex flex-col min-w-0 overflow-x-hidden">
            {children}
          </main>

          <CartDrawer />
          
          <footer className="bg-gray-300 text-gray-900 p-4 text-center text-sm">
            2025 Mixon <br/>
            Made by <a href="https://github.com/Nikkkt" className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">Nikita Terpilovskyi</a>
          </footer>
        </div>
      </div>
    </div>
  );
}