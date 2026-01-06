import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const TenantsList = lazy(() => import('./pages/tenants/TenantsList').then(module => ({ default: module.TenantsList })));
const TenantDetails = lazy(() => import('./pages/tenants/TenantDetails').then(module => ({ default: module.TenantDetails })));
const PGList = lazy(() => import('./pages/pgs/PGList').then(module => ({ default: module.PGList })));
const PGDetails = lazy(() => import('./pages/pgs/PGDetails').then(module => ({ default: module.PGDetails })));
const RentPage = lazy(() => import('./pages/rent/RentPage').then(module => ({ default: module.RentPage })));

// Loading component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pgs" element={<PGList />} />
              <Route path="/pgs/:id" element={<PGDetails />} />
              <Route path="/tenants" element={<TenantsList />} />
              <Route path="/tenants/:id" element={<TenantDetails />} />
              <Route path="/rent" element={<RentPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
