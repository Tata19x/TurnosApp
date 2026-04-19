import React, { useState, useEffect } from 'react';
import { turnosAPI, authAPI } from '../services/api';
import TurnoForm from './TurnoForm';
import TurnosList from './TurnosList';
import CalendarView from './CalendarView';

const TurnosManagement = () => {
  const [turnos, setTurnos] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list' o 'calendar'
  const [showForm, setShowForm] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);

  // Cargar turnos y empleados
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar turnos y empleados en paralelo
      const [turnosResponse, employeesResponse] = await Promise.all([
        turnosAPI.getAll(),
        authAPI.getEmployees()
      ]);

      setTurnos(turnosResponse.data);
      setEmployees(employeesResponse.data);

    } catch (err) {
      setError('Error al cargar datos: ' + (err.response?.data?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTurno = () => {
    setEditingTurno(null);
    setShowForm(true);
  };

  const handleEditTurno = (turno) => {
    setEditingTurno(turno);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTurno(null);
    loadData(); // Recargar datos
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTurno(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando turnos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Turnos</h2>
            <p className="text-gray-600 mt-1">Administra los turnos de los empleados</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de vista */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  view === 'list'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Lista
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  view === 'calendar'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Calendario
              </button>
            </div>

            {/* Botón crear turno */}
            <button
              onClick={handleCreateTurno}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              + Nuevo Turno
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de turno (mostrar cuando showForm es true) */}
      {showForm && (
        <TurnoForm
          turno={editingTurno}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          employees={employees}
        />
      )}

      {/* Vista de lista o calendario */}
      {view === 'list' ? (
        <TurnosList
          turnos={turnos}
          onEdit={handleEditTurno}
          onRefresh={loadData}
        />
      ) : (
        <CalendarView
          turnos={turnos}
          onEdit={handleEditTurno}
        />
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{turnos.length}</div>
          <div className="text-gray-600">Total Turnos</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {turnos.filter(t => new Date(t.date) >= new Date()).length}
          </div>
          <div className="text-gray-600">Próximos</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">
            {turnos.filter(t => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const turnoDate = new Date(t.date);
              return turnoDate.getTime() === today.getTime();
            }).length}
          </div>
          <div className="text-gray-600">Para Hoy</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{employees.length}</div>
          <div className="text-gray-600">Empleados</div>
        </div>
      </div>
    </div>
  );
};

export default TurnosManagement;