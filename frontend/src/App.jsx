import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardEmployee from './pages/DashboardEmployee';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard-admin"
            element={
              <PrivateRoute requiredRole="admin">
                <DashboardAdmin />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard-employee"
            element={
              <PrivateRoute requiredRole="employee">
                <DashboardEmployee />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;