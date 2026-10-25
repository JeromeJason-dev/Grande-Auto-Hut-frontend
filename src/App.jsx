import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGate from "./components/RoleGate";
import { NotificationToastProvider } from "./features/notifications/NotificationToastContext";

import HomePage from "./routes/HomePage";
import AboutPage from "./routes/AboutPage";
import FaqPage from "./routes/FaqPage";
import NotFoundPage from "./routes/NotFoundPage";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";

import CatalogPage from "./features/catalog/CatalogPage";
import ProductDetailPage from "./features/catalog/ProductDetailPage";

import FitmentPage from "./features/fitment/FitmentPage";
import FitmentResultsPage from "./features/fitment/FitmentResultsPage";

import CartPage from "./features/cart/CartPage";
import CheckoutPage from "./features/cart/CheckoutPage";

import OrdersListPage from "./features/orders/OrdersListPage";
import OrderDetailPage from "./features/orders/OrderDetailPage";

import WishlistPage from "./features/wishlist/WishlistPage";

import TicketsPage from "./features/support/TicketsPage";
import TicketDetailPage from "./features/support/TicketDetailPage";

import NotificationsPage from "./features/notifications/NotificationsPage";
import AccountPage from "./features/account/AccountPage";

import AdminLayout from "./features/admin/AdminLayout";
import AdminDashboardPage from "./features/admin/AdminDashboardPage";
import AdminProductsPage from "./features/admin/AdminProductsPage";
import AdminOrdersPage from "./features/admin/AdminOrdersPage";
import AdminCustomersPage from "./features/admin/AdminCustomersPage";
import AdminTicketsPage from "./features/admin/AdminTicketsPage";
import AdminTicketDetailPage from "./features/admin/AdminTicketDetailPage";
import AdminStaffPage from "./features/admin/AdminStaffPage";
import AdminFitmentPage from "./features/admin/AdminFitmentPage";
import AdminAccountPage from "./features/admin/AdminAccountPage";

import StaffTasksPage from "./features/staff/StaffTasksPage";
import StaffReviewsPage from "./features/staff/StaffReviewsPage";

const StaffLayout = () => <AdminLayout variant="staff" />;

export default function App() {
  return (
    <NotificationToastProvider>
      <Routes>
        {/* Public & Customer Routes */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:slug" element={<ProductDetailPage />} />

          <Route path="fitment" element={<FitmentPage />} />
          <Route path="fitment/results" element={<FitmentResultsPage />} />

          {/* Customer Protected Routes */}
          <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

          <Route path="orders" element={<ProtectedRoute><OrdersListPage /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

          <Route path="wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />

          <Route path="support" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
          <Route path="support/new" element={<Navigate to="/support" replace />} />
          <Route path="support/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />

          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin area: admins only (staff are redirected to the same page under /staff) */}
        <Route path="admin" element={<ProtectedRoute staffOnly><RoleGate area="admin"><AdminLayout /></RoleGate></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="tickets/:id" element={<AdminTicketDetailPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="fitment" element={<AdminFitmentPage />} />
          <Route path="reviews" element={<StaffReviewsPage />} />
          <Route path="account" element={<AdminAccountPage />} />
        </Route>

        {/* Staff area: tasks, products, orders, reviews, tickets and the fitment catalog */}
        <Route path="staff" element={<ProtectedRoute staffOnly><RoleGate area="staff"><StaffLayout /></RoleGate></ProtectedRoute>}>
          <Route index element={<StaffTasksPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="reviews" element={<StaffReviewsPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="tickets/:id" element={<AdminTicketDetailPage />} />
          <Route path="fitment" element={<AdminFitmentPage />} />
          <Route path="account" element={<AdminAccountPage />} />
          {/* Admin-only pages (e.g. customers) or typos land staff back on their tasks */}
          <Route path="*" element={<Navigate to="/staff" replace />} />
        </Route>
      </Routes>
    </NotificationToastProvider>
  );
}