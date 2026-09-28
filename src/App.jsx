import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationToastProvider } from "./features/notifications/NotificationToastContext";

import HomePage from "./routes/HomePage";
import AboutPage from "./routes/AboutPage";
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
import NewTicketPage from "./features/support/NewTicketPage";
import TicketDetailPage from "./features/support/TicketDetailPage";

import NotificationsPage from "./features/notifications/NotificationsPage";
import AccountPage from "./features/account/AccountPage";

import AdminLayout from "./features/admin/AdminLayout";
import AdminDashboardPage from "./features/admin/AdminDashboardPage";
import AdminProductsPage from "./features/admin/AdminProductsPage";
import AdminOrdersPage from "./features/admin/AdminOrdersPage";
import AdminCustomersPage from "./features/admin/AdminCustomersPage";
import AdminTicketsPage from "./features/admin/AdminTicketsPage";
import AdminFitmentPage from "./features/admin/AdminFitmentPage";
import AdminAccountPage from "./features/admin/AdminAccountPage";

export default function App() {
  return (
    <NotificationToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:slug" element={<ProductDetailPage />} />

          <Route path="fitment" element={<FitmentPage />} />
          <Route path="fitment/results" element={<FitmentResultsPage />} />

          <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

          <Route path="orders" element={<ProtectedRoute><OrdersListPage /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

          <Route path="wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />

          <Route path="support" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
          <Route path="support/new" element={<ProtectedRoute><NewTicketPage /></ProtectedRoute>} />
          <Route path="support/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />

          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute staffOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="fitment" element={<AdminFitmentPage />} />
          <Route path="account" element={<AdminAccountPage />} />
        </Route>
      </Routes>
    </NotificationToastProvider>
  );
}