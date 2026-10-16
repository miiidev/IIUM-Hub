import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RequireShop from './components/seller/RequireShop';
import Marketplace from './pages/Marketplace';
import HowToOrder from './pages/HowToOrder';
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
    <div className="min-h-screen bg-cream text-ink">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/how-to-order" element={<HowToOrder />} />
            <Route path="/s/:slug" element={<Storefront />} />
            <Route path="/order/:orderId/track" element={<OrderTracker />} />
            <Route path="/seller/login" element={<Login />} />
            <Route path="/seller/signup" element={<Signup />} />
            <Route path="/seller" element={<ProtectedRoute><RequireShop><Dashboard /></RequireShop></ProtectedRoute>} />
            <Route path="/seller/products" element={<ProtectedRoute><RequireShop><Products /></RequireShop></ProtectedRoute>} />
            <Route path="/seller/settings" element={<ProtectedRoute><RequireShop><Settings /></RequireShop></ProtectedRoute>} />
            <Route
              path="/seller/orders/:orderId"
              element={<ProtectedRoute><RequireShop><SellerDashboard /></RequireShop></ProtectedRoute>}
            />
            <Route
              path="*"
              element={
                <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center p-6 text-center sm:max-w-lg">
                  <h1 className="text-xl font-bold text-ink">404 — Page not found</h1>
                  <a href="/" className="mt-3 inline-flex h-12 items-center px-6 font-bold text-emerald">
                    ← Back to Marketplace
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
