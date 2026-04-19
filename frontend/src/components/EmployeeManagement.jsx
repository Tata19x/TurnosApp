import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Cargar empleados
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getEmployees();
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (err) {
      setError('Error al cargar empleados: ' + (err.response?.data?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Filtrar empleados
  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage('');

    try {
      if (editingEmployee) {
        // Actualizar empleado
        await authAPI.updateEmployee(editingEmployee.id, {
          name: formData.name,
          email: formData.email
        });
        setMessage('Empleado actualizado exitosamente');
        setMessageType('success');
      } else {
        // Crear nuevo empleado
        await authAPI.registerEmployee(formData.name, formData.email, formData.password);
        setMessage('Empleado registrado exitosamente');
        setMessageType('success');
      }

      setFormData({ name: '', email: '', password: '' });
      setEditingEmployee(null);
      setShowForm(false);
      
      setTimeout(() => {
        loadEmployees(); // Recargar lista
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error SUBMIT:', error);
      setMessageType('error');
      setMessage(error.response?.data?.message || error.message || 'Error al procesar empleado');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '', // No mostrar contraseña
    });
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      return;
    }

    try {
      await authAPI.deleteEmployee(id);
      setMessage('Empleado eliminado exitosamente');
      setMessageType('success');
    } catch (error) {
      console.error('Error DELETE:', error);
      setMessage('Error al eliminar empleado: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
      setMessageType('error');
    }
    setTimeout(() => {
      loadEmployees(); // Recargar lista
      setMessage('');
    }, 1500);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({ name: '', email: '', password: '' });
    setMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando empleados...</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Empleados</h2>
            <p className="text-gray-600 mt-1">Administra los empleados registrados en el sistema</p>
          </div>

          <button
            onClick={() => {
              setEditingEmployee(null);
              setFormData({ name: '', email: '', password: '' });
              setShowForm(true);
              setMessage('');
            }}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            + Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {editingEmployee ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
          </h3>

          {message && (
            <div
              className={`px-4 py-3 rounded mb-4 ${
                messageType === 'success'
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Nombre Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="juan@empresa.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {!editingEmployee && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Contraseña Temporal</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={formLoading}
                className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
              >
                {formLoading ? 'Procesando...' : (editingEmployee ? 'Actualizar Empleado' : 'Registrar Empleado')}
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
      )}

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar empleados por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredEmployees.length} de {employees.length} empleados
          </div>
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Empleados Registrados</h3>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Registra tu primer empleado para comenzar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {employee.role === 'employee' ? 'Empleado' : employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
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
        )}

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Total de empleados: {employees.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;