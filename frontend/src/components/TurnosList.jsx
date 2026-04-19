import React from 'react';
import { turnosAPI } from '../services/api';

const TurnosList = ({ turnos, onEdit, onDelete, onRefresh }) => {
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Parsear la fecha ISO correctamente (evitar desplazamiento de zona horaria)
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este turno?')) {
      try {
        await turnosAPI.delete(id);
        onRefresh();
      } catch (error) {
        alert('Error al eliminar turno: ' + (error.response?.data?.message || 'Error desconocido'));
      }
    }
  };

  const getStatusBadge = (turno) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Parsear la fecha ISO correctamente (evitar desplazamiento de zona horaria)
    const [year, month, day] = turno.date.split('-');
    const turnoDate = new Date(year, month - 1, day);

    if (turnoDate < today) {
      return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">Pasado</span>;
    } else if (turnoDate.toDateString() === today.toDateString()) {
      return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">Hoy</span>;
    } else {
      return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">Próximo</span>;
    }
  };

  if (turnos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay turnos</h3>
        <p className="text-gray-600">Aún no se han creado turnos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">Lista de Turnos</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {turnos.map((turno) => (
              <tr key={turno.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {turno.employee?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {turno.employee?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(turno.date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTime(turno.startTime)} - {formatTime(turno.endTime)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {turno.description || 'Sin descripción'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(turno)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(turno)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(turno.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600">
          Total de turnos: {turnos.length}
        </p>
      </div>
    </div>
  );
};

export default TurnosList;