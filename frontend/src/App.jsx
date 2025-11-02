import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import UploadProducts from "./pages/UploadProducts";
import AdminUsers from "./pages/AdminUsers";
import Departments from "./pages/Departments";
import Directions from "./pages/Directions";
import ProductGroups from "./pages/ProductGroups";
import Cart from "./pages/Cart";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />
        <Route path="/confirm-registration" element={<ConfirmRegistration />} />
        <Route path="/home" element={<Home />}/>
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders-by-code" element={<OrdersByCode />} />
        <Route path="/view-availability" element={<ViewAvailability />} />
        <Route path="/view-availability-by-group" element={<ViewAvailabilityByGroup />} />
        <Route path="/view-availability-by-code" element={<ViewAvailabilityByCode />} />
        <Route path="/upload-products" element={<UploadProducts />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/directions" element={<Directions />} />
        <Route path="/product-groups" element={<ProductGroups />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;