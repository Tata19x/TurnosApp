import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const ReportsPanel = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const loadReport = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getReportsSummary(params);
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadReport(filters);
  };

  const handleExport = async (format) => {
    try {
      const apiFunction = format === 'xlsx' ? authAPI.exportReportsExcel : authAPI.exportReports;
      setLoadingExport(true);
      setError('');

      const response = await apiFunction(filters);
      const blob = new Blob([response.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `turnos-report-${filters.startDate || 'all'}-${filters.endDate || 'all'}.${format}`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al exportar el reporte');
    } finally {
      setLoadingExport(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="mt-4 text-gray-600">Cargando reportes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Reportes de Turnos</h2>
            <p className="text-gray-600 mt-1">Filtra por rango de fechas y descarga la informacion en CSV o Excel.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <label className="block text-sm font-medium text-gray-700">
                Fecha inicio
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Fecha fin
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Aplicar filtro
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={loadingExport}
              className="inline-flex items-center justify-center bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
            >
              {loadingExport ? 'Exportando...' : 'Exportar CSV'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              disabled={loadingExport}
              className="inline-flex items-center justify-center bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-700 transition duration-200 disabled:bg-gray-400"
            >
              {loadingExport ? 'Exportando...' : 'Exportar Excel'}
            </button>
          </div>
        </div>
      </div>

      {report?.dateRangeLabel && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          {report.dateRangeLabel}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm uppercase tracking-wide mb-2">Turnos totales</div>
          <div className="text-3xl font-bold text-blue-700">{report?.totalTurnos ?? 0}</div>
          <div className="text-gray-500 mt-1">Turnos programados</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm uppercase tracking-wide mb-2">Turnos cumplidos</div>
          <div className="text-3xl font-bold text-green-700">{report?.completedTurnos ?? 0}</div>
          <div className="text-gray-500 mt-1">Turnos con fecha pasada</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm uppercase tracking-wide mb-2">Proximos turnos</div>
          <div className="text-3xl font-bold text-indigo-700">{report?.upcomingTurnos ?? 0}</div>
          <div className="text-gray-500 mt-1">Turnos futuros</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm uppercase tracking-wide mb-2">Turnos para hoy</div>
          <div className="text-3xl font-bold text-purple-700">{report?.todaysTurnos ?? 0}</div>
          <div className="text-gray-500 mt-1">Turnos del dia actual</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Turnos por empleado</h3>
          <div className="space-y-3">
            {report?.turnosByEmployee?.slice(0, 5).map((employee) => (
              <div key={employee.employeeId} className="flex justify-between items-center gap-4 p-3 rounded-lg bg-gray-50">
                <div>
                  <div className="font-semibold text-gray-800">{employee.name}</div>
                  <div className="text-sm text-gray-500">{employee.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{employee.turnos}</div>
                  <div className="text-sm text-gray-500">{employee.hours}h</div>
                </div>
              </div>
            ))}
            {!report?.turnosByEmployee?.length && (
              <div className="text-gray-500">No hay turnos asignados aun.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Dias mas ocupados</h3>
          <div className="space-y-3">
            {report?.busiestDays?.map((day) => (
              <div key={day.date} className="flex justify-between items-center gap-4 p-3 rounded-lg bg-gray-50">
                <div className="text-gray-800">{day.date}</div>
                <div className="text-lg font-bold text-gray-900">{day.turnos}</div>
              </div>
            ))}
            {!report?.busiestDays?.length && (
              <div className="text-gray-500">Sin dias ocupados por el momento.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
