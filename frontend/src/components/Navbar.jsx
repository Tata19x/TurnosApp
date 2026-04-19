import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">TurnosApp</h1>
          {user && (
            <span className="text-blue-100">
              Bienvenido, {user.name} ({user.role === 'admin' ? 'Administrador' : 'Empleado'})
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition duration-200"
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;