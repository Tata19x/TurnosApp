import React, { useState, useEffect } from 'react';
import { turnosAPI } from '../services/api';

const TurnoForm = ({ turno, onSuccess, onCancel, employees }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Si es edición, cargar datos del turno
  useEffect(() => {
    if (turno) {
      setFormData({
        employeeId: turno.employeeId,
        date: turno.date,
        startTime: turno.startTime,
        endTime: turno.endTime,
        description: turno.description || '',
      });
    }
  }, [turno]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (turno) {
        // Editar turno existente
        await turnosAPI.update(turno.id, formData);
      } else {
        // Crear nuevo turno
        await turnosAPI.create(formData);
      }

      onSuccess();
      if (!turno) {
        // Limpiar formulario solo si es creación
        setFormData({
          employeeId: '',
          date: '',
          startTime: '',
          endTime: '',
          description: '',
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
    });
    setError('');
    onCancel();
  };

  // Obtener fecha mínima (hoy)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

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
            <label className="block text-gray-700 font-semibold mb-2">Fecha</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={getMinDate()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
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

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : (turno ? 'Actualizar Turno' : 'Crear Turno')}
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