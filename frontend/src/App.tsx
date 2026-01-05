import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { TenantsList } from './pages/tenants/TenantsList';
import { PGList } from './pages/pgs/PGList';
import { PGDetails } from './pages/pgs/PGDetails';
import { RentPage } from './pages/rent/RentPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pgs" element={<PGList />} />
            <Route path="/pgs/:id" element={<PGDetails />} />
            <Route path="/tenants" element={<TenantsList />} />
            <Route path="/rent" element={<RentPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
