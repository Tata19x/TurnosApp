import React, { useEffect, useMemo, useState } from 'react';
import { turnosAPI } from '../services/api';

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const TurnosList = ({ turnos, employees = [], onEdit, onRefresh }) => {
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    search: '',
    employeeId: '',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return parseLocalDate(dateString).toLocaleDateString('es-ES', options);
  };

  const formatTime = (timeString) => timeString.substring(0, 5);

  const getTurnoStatus = (turno) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const turnoDate = parseLocalDate(turno.date);

    if (turnoDate < today) return 'passed';
    if (turnoDate.toDateString() === today.toDateString()) return 'today';
    return 'upcoming';
  };

  const statusLabels = {
    all: 'Todos',
    today: 'Hoy',
    upcoming: 'Proximos',
    passed: 'Cumplidos',
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, viewMode]);

  const sortedTurnos = useMemo(() => {
    const today = [];
    const upcoming = [];
    const passed = [];

    turnos.forEach((turno) => {
      const status = getTurnoStatus(turno);
      if (status === 'today') today.push(turno);
      else if (status === 'upcoming') upcoming.push(turno);
      else passed.push(turno);
    });

    const sortByTime = (a, b) => a.startTime.localeCompare(b.startTime);
    today.sort(sortByTime);
    upcoming.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : sortByTime(a, b);
    });
    passed.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      return dateCompare !== 0 ? dateCompare : sortByTime(b, a);
    });

    return [...today, ...upcoming, ...passed];
  }, [turnos]);

  const filteredTurnos = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return sortedTurnos.filter((turno) => {
      const employeeName = turno.employee?.name || '';
      const employeeEmail = turno.employee?.email || '';
      const description = turno.description || '';
      const status = getTurnoStatus(turno);

      const matchesSearch = !normalizedSearch ||
        employeeName.toLowerCase().includes(normalizedSearch) ||
        employeeEmail.toLowerCase().includes(normalizedSearch) ||
        description.toLowerCase().includes(normalizedSearch);

      const matchesEmployee = !filters.employeeId || String(turno.employeeId) === filters.employeeId;
      const matchesStatus = filters.status === 'all' || status === filters.status;
      const matchesStartDate = !filters.startDate || turno.date >= filters.startDate;
      const matchesEndDate = !filters.endDate || turno.date <= filters.endDate;

      return matchesSearch && matchesEmployee && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [filters, sortedTurnos]);

  const groupedTurnos = useMemo(() => {
    const groups = new Map();

    filteredTurnos.forEach((turno) => {
      const key = turno.employeeId;
      const group = groups.get(key) || {
        employee: turno.employee,
        turnos: [],
      };

      group.turnos.push(turno);
      groups.set(key, group);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const nameA = a.employee?.name || '';
      const nameB = b.employee?.name || '';
      return nameA.localeCompare(nameB);
    });
  }, [filteredTurnos]);

  const totalPages = Math.ceil(filteredTurnos.length / itemsPerPage);
  const paginatedTurnos = filteredTurnos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filterSummary = useMemo(() => ({
    total: filteredTurnos.length,
    today: filteredTurnos.filter((turno) => getTurnoStatus(turno) === 'today').length,
    upcoming: filteredTurnos.filter((turno) => getTurnoStatus(turno) === 'upcoming').length,
    passed: filteredTurnos.filter((turno) => getTurnoStatus(turno) === 'passed').length,
  }), [filteredTurnos]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      employeeId: '',
      status: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Estas seguro de que quieres eliminar este turno?')) {
      try {
        await turnosAPI.delete(id);
        onRefresh();
      } catch (error) {
        alert('Error al eliminar turno: ' + (error.response?.data?.message || 'Error desconocido'));
      }
    }
  };

  const getStatusBadge = (turno) => {
    const status = getTurnoStatus(turno);
    if (status === 'passed') {
      return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">Cumplido</span>;
    }
    if (status === 'today') {
      return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">Hoy</span>;
    }
    return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">Proximo</span>;
  };

  const renderTurnoActions = (turno) => (
    <div className="flex gap-3 text-sm font-medium">
      <button
        type="button"
        onClick={() => onEdit(turno)}
        className="text-blue-600 hover:text-blue-900"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => handleDelete(turno.id)}
        className="text-red-600 hover:text-red-900"
      >
        Eliminar
      </button>
    </div>
  );

  if (turnos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay turnos</h3>
        <p className="text-gray-600">Aun no se han creado turnos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Lista de Turnos</h3>
            <p className="text-sm text-gray-500 mt-1">Filtra y revisa los turnos por empleado, estado o fecha.</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tabla
            </button>
            <button
              type="button"
              onClick={() => setViewMode('employee')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                viewMode === 'employee' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por empleado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <label className="md:col-span-2 text-sm font-medium text-gray-700">
            Buscar
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Empleado, email o descripcion"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Empleado
            <select
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Todos</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Estado
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Desde
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Hasta
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">Total: {filterSummary.total}</span>
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-700">Hoy: {filterSummary.today}</span>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">Proximos: {filterSummary.upcoming}</span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">Cumplidos: {filterSummary.passed}</span>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="self-start sm:self-auto px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {filteredTurnos.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No hay turnos que coincidan con los filtros.</div>
      ) : viewMode === 'employee' ? (
        <div className="divide-y divide-gray-200">
          {groupedTurnos.map((group) => (
            <div key={group.employee?.id || 'sin-empleado'} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{group.employee?.name || 'Sin empleado'}</h4>
                  <p className="text-sm text-gray-500">{group.employee?.email || 'Sin email'}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">{group.turnos.length} turnos</span>
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700">
                    {group.turnos.filter((turno) => getTurnoStatus(turno) === 'today').length} hoy
                  </span>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    {group.turnos.filter((turno) => getTurnoStatus(turno) === 'upcoming').length} proximos
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {group.turnos.map((turno) => (
                  <div key={turno.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between gap-4 mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{formatDate(turno.date)}</div>
                        <div className="text-sm text-gray-600">{formatTime(turno.startTime)} - {formatTime(turno.endTime)}</div>
                      </div>
                      {getStatusBadge(turno)}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">{turno.description || 'Sin descripcion'}</div>
                    {renderTurnoActions(turno)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripcion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTurnos.map((turno) => (
                  <tr key={turno.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{turno.employee?.name}</div>
                      <div className="text-xs text-gray-500">{turno.employee?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(turno.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatTime(turno.startTime)} - {formatTime(turno.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">{turno.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(turno)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderTurnoActions(turno)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <p className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredTurnos.length)} de {filteredTurnos.length} turnos
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TurnosList;
