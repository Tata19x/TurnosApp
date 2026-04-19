import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { turnosAPI } from '../services/api';

const DashboardEmployee = () => {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list' o 'calendar'

  // Cargar turnos del empleado
  useEffect(() => {
    const loadTurnos = async () => {
      try {
        setLoading(true);
        const response = await turnosAPI.getAll();
        // Filtrar solo los turnos del empleado actual
        const employeeTurnos = response.data.filter(turno => turno.employeeId === user.id);
        setTurnos(employeeTurnos);
      } catch (err) {
        setError('Error al cargar turnos: ' + (err.response?.data?.message || 'Error desconocido'));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadTurnos();
    }
  }, [user]);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Parsear la fecha ISO correctamente
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  // Calcular estadísticas
  const getStats = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const proximosTurnos = turnos.filter(turno => {
      const [year, month, day] = turno.date.split('-');
      const turnoDate = new Date(year, month - 1, day);
      return turnoDate >= now;
    });

    const turnosEsteMes = turnos.filter(turno => {
      const [year, month, day] = turno.date.split('-');
      const turnoDate = new Date(year, month - 1, day);
      return turnoDate.getMonth() === currentMonth && turnoDate.getFullYear() === currentYear;
    });

    // Calcular horas trabajadas este mes
    const horasTrabajadas = turnosEsteMes.reduce((total, turno) => {
      const start = new Date(`2000-01-01T${turno.startTime}`);
      const end = new Date(`2000-01-01T${turno.endTime}`);
      const horas = (end - start) / (1000 * 60 * 60);
      return total + horas;
    }, 0);

    return {
      proximos: proximosTurnos.length,
      asistenciaMes: turnosEsteMes.length,
      horasTrabajadas: Math.round(horasTrabajadas)
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Tarjeta de Bienvenida */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {user?.name}!</h1>
          <p className="text-blue-100">Aquí puedes visualizar tus turnos asignados</p>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-blue-600 text-4xl mb-2">📅</div>
            <h3 className="text-gray-600 text-sm font-semibold">Próximos Turnos</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.proximos}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-green-600 text-4xl mb-2">✅</div>
            <h3 className="text-gray-600 text-sm font-semibold">Asistencia Este Mes</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.asistenciaMes}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-purple-600 text-4xl mb-2">⏱️</div>
            <h3 className="text-gray-600 text-sm font-semibold">Horas Trabajadas</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.horasTrabajadas}h</p>
          </div>
        </div>

        {/* Sección de Turnos */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mis Turnos</h2>

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
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando turnos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : view === 'list' ? (
            turnos.length > 0 ? (
              <div className="space-y-4">
                {turnos.map((turno) => (
                  <div
                    key={turno.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {formatDate(turno.date)}
                      </h3>
                      {(() => {
                        const [year, month, day] = turno.date.split('-');
                        const turnoDate = new Date(year, month - 1, day);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        if (turnoDate < today) {
                          return <span className="bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">Pasado</span>;
                        } else if (turnoDate.getTime() === today.getTime()) {
                          return <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">Hoy</span>;
                        } else {
                          return <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">Próximo</span>;
                        }
                      })()}
                    </div>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">🕐</span>
                        <span>
                          {formatTime(turno.startTime)} - {formatTime(turno.endTime)}
                        </span>
                      </div>
                      {turno.description && (
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">📝</span>
                          <span>{turno.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-600">No tienes turnos asignados</p>
              </div>
            )
          ) : (
            // Vista de calendario simple para empleados
            <div className="grid grid-cols-7 gap-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Días del mes actual */}
              {(() => {
                const now = new Date();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

                const days = [];

                // Espacios vacíos para días del mes anterior
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="p-2"></div>);
                }

                // Función para crear dateString en formato YYYY-MM-DD (local, no UTC)
                const getLocalDateString = (date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                };

                // Días del mes actual
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(now.getFullYear(), now.getMonth(), day);
                  const dateString = getLocalDateString(date);
                  const dayTurnos = turnos.filter(turno => turno.date === dateString);
                  const isToday = getLocalDateString(date) === getLocalDateString(now);

                  days.push(
                    <div
                      key={day}
                      className={`p-2 border rounded min-h-16 ${
                        isToday ? 'bg-blue-100 border-blue-300' : 'border-gray-200'
                      } ${dayTurnos.length > 0 ? 'bg-green-50' : ''}`}
                    >
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                        {day}
                      </div>
                      {dayTurnos.map((turno, index) => (
                        <div key={turno.id} className="text-xs text-green-700 mt-1 truncate">
                          {formatTime(turno.startTime)}
                        </div>
                      ))}
                    </div>
                  );
                }

                return days;
              })()}
            </div>
          )}
        </div>
        </div>
      </div>
  );
};

export default DashboardEmployee;