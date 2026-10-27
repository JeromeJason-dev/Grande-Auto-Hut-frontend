import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGate from "./components/RoleGate";
import { NotificationToastProvider } from "./features/notifications/NotificationToastContext";

import HomePage from "./routes/HomePage";
const AboutPage = lazy(() => import("./routes/AboutPage"));
const FaqPage = lazy(() => import("./routes/FaqPage"));
import NotFoundPage from "./routes/NotFoundPage";

const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const RegisterPage = lazy(() => import("./features/auth/RegisterPage"));

const CatalogPage = lazy(() => import("./features/catalog/CatalogPage"));
const ProductDetailPage = lazy(() => import("./features/catalog/ProductDetailPage"));

const FitmentPage = lazy(() => import("./features/fitment/FitmentPage"));
const FitmentResultsPage = lazy(() => import("./features/fitment/FitmentResultsPage"));

const CartPage = lazy(() => import("./features/cart/CartPage"));
const CheckoutPage = lazy(() => import("./features/cart/CheckoutPage"));

const OrdersListPage = lazy(() => import("./features/orders/OrdersListPage"));
const OrderDetailPage = lazy(() => import("./features/orders/OrderDetailPage"));

const WishlistPage = lazy(() => import("./features/wishlist/WishlistPage"));

const TicketsPage = lazy(() => import("./features/support/TicketsPage"));
const TicketDetailPage = lazy(() => import("./features/support/TicketDetailPage"));

const NotificationsPage = lazy(() => import("./features/notifications/NotificationsPage"));
const AccountPage = lazy(() => import("./features/account/AccountPage"));

const AdminLayout = lazy(() => import("./features/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./features/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("./features/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./features/admin/AdminOrdersPage"));
const AdminCustomersPage = lazy(() => import("./features/admin/AdminCustomersPage"));
const AdminTicketsPage = lazy(() => import("./features/admin/AdminTicketsPage"));
const AdminTicketDetailPage = lazy(() => import("./features/admin/AdminTicketDetailPage"));
const AdminStaffPage = lazy(() => import("./features/admin/AdminStaffPage"));
const AdminFitmentPage = lazy(() => import("./features/admin/AdminFitmentPage"));
const AdminAccountPage = lazy(() => import("./features/admin/AdminAccountPage"));

const StaffTasksPage = lazy(() => import("./features/staff/StaffTasksPage"));
const StaffReviewsPage = lazy(() => import("./features/staff/StaffReviewsPage"));

const ForgotPasswordPage = lazy(() => import("./features/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./features/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./features/auth/VerifyEmailPage"));

const PageLoading = () => (
  <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center text-sm text-[#7C7669] dark:text-slate-400">
    Loading…
  </div>
);

const StaffLayout = () => <AdminLayout variant="staff" />;

export default function App() {
  return (
    <NotificationToastProvider>
      <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public & Customer Routes */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />

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
      </Suspense>
    </NotificationToastProvider>
  );
}