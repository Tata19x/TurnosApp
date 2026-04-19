import React, { useState } from 'react';

const CalendarView = ({ turnos, onEdit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Obtener días del mes actual
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Función para crear dateString en formato YYYY-MM-DD (local, no UTC)
    const getLocalDateString = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Agregar días del mes anterior para completar la primera semana
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        turnos: []
      });
    }

    // Agregar días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      const dateString = getLocalDateString(d);
      const dayTurnos = turnos.filter(turno => turno.date === dateString);

      days.push({
        date: d,
        isCurrentMonth: true,
        turnos: dayTurnos
      });
    }

    // Agregar días del mes siguiente para completar la última semana
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        turnos: []
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header del calendario */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Calendario de Turnos</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Hoy
            </button>
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <span className="text-lg font-semibold min-w-32 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="p-6">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-24 p-2 border border-gray-200 ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday(day.date) ? 'bg-blue-50 border-blue-300' : ''} ${
                isPast(day.date) ? 'opacity-60' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday(day.date) ? 'text-blue-600' : ''}`}>
                {day.date.getDate()}
              </div>

              {/* Turnos del día */}
              <div className="space-y-1">
                {day.turnos.slice(0, 3).map((turno) => (
                  <div
                    key={turno.id}
                    onClick={() => onEdit(turno)}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 truncate"
                    title={`${turno.employee?.name}: ${formatTime(turno.startTime)} - ${formatTime(turno.endTime)}`}
                  >
                    {formatTime(turno.startTime)} {turno.employee?.name}
                  </div>
                ))}
                {day.turnos.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{day.turnos.length - 3} más
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
            <span>Turno</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded mr-2"></div>
            <span>Hoy</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-50 rounded mr-2"></div>
            <span>Mes anterior/siguiente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;