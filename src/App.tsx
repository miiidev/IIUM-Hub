import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Marketplace from './pages/Marketplace';
import Storefront from './pages/Storefront';
import OrderTracker from './pages/OrderTracker';
import SellerDashboard from './pages/SellerDashboard';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/seller/Dashboard';
import Products from './pages/seller/Products';
import Settings from './pages/seller/Settings';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/s/:slug" element={<Storefront />} />
            <Route path="/order/:orderId/track" element={<OrderTracker />} />
            <Route path="/seller/login" element={<Login />} />
            <Route path="/seller/signup" element={<Signup />} />
            <Route path="/seller" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/seller/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/seller/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route
              path="/seller/orders/:orderId"
              element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}
            />
            <Route
              path="*"
              element={
                <div className="mx-auto w-full max-w-md sm:max-w-lg p-6 text-center min-h-screen bg-slate-50">
                  <h1 className="text-xl font-bold text-slate-900">404 — Tiada page</h1>
                  <a href="/" className="mt-2 inline-block h-12 px-6 py-3 font-bold text-emerald-700">
                    ← Kembali ke Marketplace
                  </a>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
