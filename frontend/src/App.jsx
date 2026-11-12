import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EquipmentDetail from './pages/Equipmentdetail';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageEquipments from './pages/admin/ManageEquipments';
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute'; 
import ListEquipments from './pages/equipment/Listequipments'; 
import BrowseEquipment from './pages/equipment/Browseequipment';
import HowitWorks from './pages/Howitworks';
import Notification from './pages/Notifications';
import Messages from './pages/Messages';
import CartCheckout from './pages/Cartcheckout' 
import RentalDetail from './pages/RentalDetail';
import MainLayout from './components/layout/MainLayout';
import ContractReview from './pages/contract/ContractReview';
import { PreferencesProvider } from './context/PreferencesContext';
function App() {
  return (
    <PreferencesProvider>
      <Router>
        <ScrollToTop />
<Routes>
  {/* Các trang dùng header chung */}
  <Route element={<MainLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/equipment/:id" element={<EquipmentDetail />} />
    <Route path="/equipments/:id" element={<EquipmentDetail />} />
    <Route path="/list-equipment" element={<ListEquipments />} />
    <Route path="/browse" element={<BrowseEquipment />} />
    <Route path="/how-it-works" element={<HowitWorks />} />
    <Route path="/notifications" element={<Notification />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/payment" element={<CartCheckout />} />
    <Route path="/rental-detail" element={<RentalDetail />} />
    <Route path="/contracts/:contractId" element={<ContractReview />} />
    <Route
      path="/profile"
      element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      }
    />

    <Route
      path="/profile/change-password"
      element={
        <PrivateRoute>
          <ChangePassword />
        </PrivateRoute>
      }
    />

    <Route
      path="/admin"
      element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      }
    />

    <Route
      path="/admin/equipments"
      element={
        <AdminRoute>
          <ManageEquipments />
        </AdminRoute>
      }
    />
  </Route>

  {/* Các trang không dùng header chung */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
</Routes>

      </Router>
    </PreferencesProvider>
  );
}

export default App;