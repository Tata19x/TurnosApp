import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import TurnosManagement from '../components/TurnosManagement';
import EmployeeManagement from '../components/EmployeeManagement';
import ReportsPanel from '../components/ReportsPanel';

const DashboardAdmin = () => {
  const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'register', 'turnos', 'reports'

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveSection('register')}
            className={`rounded-lg shadow p-6 hover:shadow-lg transition text-left ${
              activeSection === 'register' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
          >
            <div className="text-blue-600 text-3xl mb-2">👥</div>
            <h3 className="text-lg font-semibold text-gray-800">Registrar Empleado</h3>
            <p className="text-gray-600 text-sm mt-2">Crear nuevas cuentas para empleados</p>
          </button>

          <button
            onClick={() => setActiveSection('turnos')}
            className={`rounded-lg shadow p-6 hover:shadow-lg transition text-left ${
              activeSection === 'turnos' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
          >
            <div className="text-green-600 text-3xl mb-2">📅</div>
            <h3 className="text-lg font-semibold text-gray-800">Gestionar Turnos</h3>
            <p className="text-gray-600 text-sm mt-2">Crear, editar o eliminar turnos</p>
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className={`rounded-lg shadow p-6 hover:shadow-lg transition text-left ${
              activeSection === 'reports' ? 'ring-2 ring-purple-500 bg-purple-50' : ''
            }`}
          >
            <div className="text-purple-600 text-3xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-800">Ver Reportes</h3>
            <p className="text-gray-600 text-sm mt-2">Reportes de asistencia y turnos</p>
          </button>
        </div>

        {/* Contenido dinámico basado en la sección activa */}
        {activeSection === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Panel Administrativo</h2>
            <p className="text-gray-600 mb-4">
              Usa el panel para crear empleados, gestionar turnos y revisar reportes de actividad.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-700">Registrar Empleados</h3>
                <p className="text-gray-600 mt-2">Crea cuentas para tu equipo y asigna turnos.</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-700">Gestionar Turnos</h3>
                <p className="text-gray-600 mt-2">Administra y actualiza los turnos de tus empleados.</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-700">Ver Reportes</h3>
                <p className="text-gray-600 mt-2">Consulta métricas de turnos y horas trabajadas.</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'register' && (
          <EmployeeManagement />
        )}

        {activeSection === 'turnos' && (
          <TurnosManagement />
        )}

        {activeSection === 'reports' && (
          <ReportsPanel />
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;