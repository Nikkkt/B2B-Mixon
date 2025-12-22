import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PasswordReset from "./pages/PasswordReset";
import SetNewPassword from "./pages/SetNewPassword";
import ConfirmRegistration from "./pages/ConfirmRegistration";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import OrdersByCode from "./pages/OrdersByCode";
import ViewAvailability from "./pages/ViewAvailability";
import ViewAvailabilityByGroup from "./pages/ViewAvailabilityByGroup";
import ViewAvailabilityByCode from "./pages/ViewAvailabilityByCode";
import AvailabilityDownload from "./pages/AvailabilityDownload";
import UploadProducts from "./pages/UploadProducts";
import AdminUsers from "./pages/AdminUsers";
import Departments from "./pages/Departments";
import Directions from "./pages/Directions";
import ProductGroups from "./pages/ProductGroups";
import Cart from "./pages/Cart";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";

const DEFAULT_TITLE = "Mixon B2B";
const ROUTE_TITLES = {
  "/": "Вхід | Mixon B2B",
  "/login": "Вхід | Mixon B2B",
  "/register": "Реєстрація | Mixon B2B",
  "/password-reset": "Відновлення паролю | Mixon B2B",
  "/set-new-password": "Новий пароль | Mixon B2B",
  "/confirm-registration": "Підтвердження реєстрації | Mixon B2B",
  "/home": "Головна | Mixon B2B",
  "/orders": "Замовлення товарів | Mixon B2B",
  "/orders-by-code": "Замовлення по кодах | Mixon B2B",
  "/view-availability": "Перегляд наявності | Mixon B2B",
  "/view-availability-by-group": "Наявність по групах | Mixon B2B",
  "/view-availability-by-code": "Наявність по кодах | Mixon B2B",
  "/availability-download": "Завантаження наявності | Mixon B2B",
  "/upload-products": "Завантаження товарів | Mixon B2B",
  "/users": "Користувачі | Mixon B2B",
  "/departments": "Відділи | Mixon B2B",
  "/directions": "Направлення | Mixon B2B",
  "/product-groups": "Групи товарів | Mixon B2B",
  "/cart": "Кошик | Mixon B2B",
  "/order-history": "Історія замовлень | Mixon B2B",
  "/profile": "Профіль | Mixon B2B",
};

function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = ROUTE_TITLES[location.pathname] || DEFAULT_TITLE;
    document.title = pageTitle;
  }, [location.pathname]);

  return null;
}

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

const normalizeRoles = (roles) => {
  if (!roles) {
    return [];
  }

  if (Array.isArray(roles)) {
    return roles
      .map((value) => (value ?? "").toString().toLowerCase())
      .filter(Boolean);
  }

  if (typeof roles === "string") {
    return [roles.toLowerCase()];
  }

  if (typeof roles === "number") {
    switch (roles) {
      case 3:
        return ["department"];
      case 2:
        return ["admin"];
      case 1:
        return ["manager"];
      default:
        return ["user"];
    }
  }

  if (roles && typeof roles === "object" && "name" in roles) {
    return [String(roles.name).toLowerCase()];
  }

  return [];
};

function RequireAdmin() {
  const { user } = useAuth();
  const location = useLocation();
  const roles = normalizeRoles(user?.roles ?? user?.role);

  if (!roles.includes("admin")) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function RequireAvailabilityUploader() {
  const { user } = useAuth();
  const location = useLocation();
  const roles = normalizeRoles(user?.roles ?? user?.role);

  const hasAccess = roles.includes("admin") || roles.includes("department");

  if (!hasAccess) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <TitleManager />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/set-new-password" element={<SetNewPassword />} />
          <Route path="/confirm-registration" element={<ConfirmRegistration />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders-by-code" element={<OrdersByCode />} />
          <Route path="/view-availability" element={<ViewAvailability />} />
          <Route path="/view-availability-by-group" element={<ViewAvailabilityByGroup />} />
          <Route path="/view-availability-by-code" element={<ViewAvailabilityByCode />} />

          <Route element={<RequireAvailabilityUploader />}>
            <Route path="/availability-download" element={<AvailabilityDownload />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/upload-products" element={<UploadProducts />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/directions" element={<Directions />} />
            <Route path="/product-groups" element={<ProductGroups />} />
          </Route>
          
          <Route path="/cart" element={<Cart />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;