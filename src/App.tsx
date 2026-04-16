import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { OrderDetailPage } from "./pages/OrderDetailPage.tsx";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import "./App.css";

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />

          {/* Protected Routes */}
          <Route path="/cart" element={<ProtectedRoute element={<CartPage />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route
            path="/checkout"
            element={<ProtectedRoute element={<CheckoutPage />} />}
          />
          <Route
            path="/order-success/:id"
            element={<ProtectedRoute element={<OrderSuccessPage />} />}
          />
          <Route
            path="/orders/:id"
            element={<ProtectedRoute element={<OrderDetailPage />} />}
          />

          {/* Admin Route */}
          <Route path="/admin" element={<ProtectedRoute element={<AdminPage />} requireAdmin />} />
          <Route path="/admin/users" element={<ProtectedRoute element={<AdminUsersPage />} requireAdmin />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <CurrencyProvider>
            <AppContent />
          </CurrencyProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
