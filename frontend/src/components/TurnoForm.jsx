import React, { useState, useEffect } from 'react';
import { turnosAPI } from '../services/api';

const TurnoForm = ({ turno, onSuccess, onCancel, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    recurring: false,
    endDateRecurring: '',
    daysOfWeek: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (turno) {
      setFormData({
        employeeId: turno.employeeId,
        date: turno.date,
        startTime: turno.startTime,
        endTime: turno.endTime,
        description: turno.description || '',
        recurring: false,
        endDateRecurring: '',
        daysOfWeek: [],
      });
    }
  }, [turno]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const generateRecurringDates = () => {
    const dates = [];
    const [year, month, day] = formData.date.split('-').map(Number);
    const [endYear, endMonth, endDay] = formData.endDateRecurring.split('-').map(Number);
    let currentDate = new Date(year, month - 1, day);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (formData.daysOfWeek.includes(dayOfWeek.toString())) {
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        const currentDay = String(currentDate.getDate()).padStart(2, '0');
        dates.push(`${currentYear}-${currentMonth}-${currentDay}`);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (turno) {
        await turnosAPI.update(turno.id, {
          employeeId: formData.employeeId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          description: formData.description,
        });
      } else if (formData.recurring) {
        if (!formData.endDateRecurring) {
          setError('Selecciona la fecha de fin de recurrencia');
          setLoading(false);
          return;
        }

        if (formData.endDateRecurring < formData.date) {
          setError('La fecha de fin de recurrencia debe ser igual o posterior a la fecha de inicio');
          setLoading(false);
          return;
        }

        if (formData.daysOfWeek.length === 0) {
          setError('Selecciona al menos un dia de la semana para la recurrencia');
          setLoading(false);
          return;
        }

        const dates = generateRecurringDates();
        if (dates.length === 0) {
          setError('No se seleccionó ningún día para la recurrencia');
          setLoading(false);
          return;
        }

        const turnos = dates.map((date) => ({
          employeeId: formData.employeeId,
          date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          description: formData.description,
        }));

        await turnosAPI.createBulk(turnos);
      } else {
        await turnosAPI.create({
          employeeId: formData.employeeId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          description: formData.description,
        });
      }

      onSuccess();
      if (!turno) {
        setFormData({
          employeeId: '',
          date: '',
          startTime: '',
          endTime: '',
          description: '',
          recurring: false,
          endDateRecurring: '',
          daysOfWeek: [],
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      employeeId: '',
      date: '',
      startTime: '',
      endTime: '',
      description: '',
      recurring: false,
      endDateRecurring: '',
      daysOfWeek: [],
    });
    setError('');
    onCancel();
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const daysOfWeekNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">
        {turno ? 'Editar Turno' : 'Crear Nuevo Turno'}
      </h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Empleado</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={!!turno}
            >
              <option value="">Seleccionar empleado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Fecha Inicio</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={getMinDate()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={!!turno}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Hora Inicio</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Hora Fin</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Descripción (opcional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Descripción del turno..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {!turno && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-center mb-4 cursor-pointer">
              <input
                type="checkbox"
                name="recurring"
                checked={formData.recurring}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-600"
              />
              <span className="ml-3 font-semibold text-gray-700">Crear turno recurrente</span>
            </label>

            {formData.recurring && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Selecciona los días de la semana y la fecha de fin:</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {daysOfWeekNames.map((day, index) => (
                    <label key={index} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.daysOfWeek.includes(index.toString())}
                        onChange={() => handleDayToggle(index.toString())}
                        className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Fecha de Fin de Recurrencia</label>
                  <input
                    type="date"
                    name="endDateRecurring"
                    value={formData.endDateRecurring}
                    onChange={handleInputChange}
                    min={formData.date}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required={formData.recurring}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : turno ? 'Actualizar Turno' : 'Crear Turno(s)'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-500 transition duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TurnoForm;
