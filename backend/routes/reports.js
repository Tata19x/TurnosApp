const express = require('express');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const { Turno, User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return new Date(year, month - 1, day);
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return { [Op.between]: [startDate, endDate] };
  }
  if (startDate) {
    return { [Op.gte]: startDate };
  }
  if (endDate) {
    return { [Op.lte]: endDate };
  }
  return undefined;
};

const getDateRangeLabel = (startDate, endDate) => {
  if (startDate && endDate) return `Rango: ${startDate} a ${endDate}`;
  if (startDate) return `Desde ${startDate}`;
  if (endDate) return `Hasta ${endDate}`;
  return 'Resumen del mes actual';
};

router.get('/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dateFilter = buildDateFilter(startDate, endDate);

    const where = dateFilter ? { date: dateFilter } : {};

    const [turnos, totalEmployees] = await Promise.all([
      Turno.findAll({
        where,
        include: [{
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email'],
        }],
        order: [['date', 'ASC'], ['startTime', 'ASC']],
      }),
      User.count({ where: { role: 'employee' } }),
    ]);

    const totalTurnos = turnos.length;
    const completedTurnos = turnos.filter((turno) => parseLocalDate(turno.date) < today).length;
    const upcomingTurnos = turnos.filter((turno) => parseLocalDate(turno.date) > today).length;
    const todaysTurnos = turnos.filter((turno) => getLocalDateString(parseLocalDate(turno.date)) === getLocalDateString(today)).length;

    let totalHoursThisMonth = 0;
    let totalHoursInRange = 0;
    const employeeMap = new Map();
    const dayMap = new Map();

    turnos.forEach((turno) => {
      const turnoDate = parseLocalDate(turno.date);
      const dayKey = getLocalDateString(turnoDate);

      const start = new Date(`2000-01-01T${turno.startTime}`);
      const end = new Date(`2000-01-01T${turno.endTime}`);
      const hours = Math.max((end - start) / (1000 * 60 * 60), 0);

      if (turnoDate.getMonth() === currentMonth && turnoDate.getFullYear() === currentYear) {
        totalHoursThisMonth += hours;
      }
      totalHoursInRange += hours;

      if (turno.employee) {
        const employeeId = turno.employee.id;
        const summary = employeeMap.get(employeeId) || {
          employeeId,
          name: turno.employee.name,
          email: turno.employee.email,
          turnos: 0,
          hours: 0,
        };

        summary.turnos += 1;
        summary.hours += hours;
        employeeMap.set(employeeId, summary);
      }

      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
    });

    const turnosByEmployee = Array.from(employeeMap.values()).sort((a, b) => b.turnos - a.turnos);
    const busiestDays = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, turnos: count }))
      .sort((a, b) => b.turnos - a.turnos)
      .slice(0, 5);

    res.json({
      totalEmployees,
      totalTurnos,
      completedTurnos,
      upcomingTurnos,
      todaysTurnos,
      totalHoursThisMonth: Math.round(totalHoursThisMonth * 100) / 100,
      totalHoursInRange: Math.round(totalHoursInRange * 100) / 100,
      turnosByEmployee,
      busiestDays,
      dateRangeLabel: getDateRangeLabel(startDate, endDate),
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ message: 'Error al generar el reporte' });
  }
});

router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const where = dateFilter ? { date: dateFilter } : {};

    const turnos = await Turno.findAll({
      where,
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email'],
      }],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    const rows = [
      ['Empleado', 'Email', 'Fecha', 'Inicio', 'Fin', 'Duración (h)', 'Descripción'],
    ];

    turnos.forEach((turno) => {
      const start = new Date(`2000-01-01T${turno.startTime}`);
      const end = new Date(`2000-01-01T${turno.endTime}`);
      const duration = Math.max((end - start) / (1000 * 60 * 60), 0);
      rows.push([
        turno.employee?.name || 'Sin asignar',
        turno.employee?.email || 'N/A',
        turno.date,
        turno.startTime,
        turno.endTime,
        duration.toFixed(2),
        turno.description || '',
      ]);
    });

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="turnos-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exportando reporte:', error);
    res.status(500).json({ message: 'Error al exportar el reporte' });
  }
});

router.get('/export-excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const where = dateFilter ? { date: dateFilter } : {};

    const turnos = await Turno.findAll({
      where,
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email'],
      }],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    const data = turnos.map((turno) => {
      const start = new Date(`2000-01-01T${turno.startTime}`);
      const end = new Date(`2000-01-01T${turno.endTime}`);
      const duration = Math.max((end - start) / (1000 * 60 * 60), 0);
      return {
        Empleado: turno.employee?.name || 'Sin asignar',
        Email: turno.employee?.email || 'N/A',
        Fecha: turno.date,
        Inicio: turno.startTime,
        Fin: turno.endTime,
        'Duración (h)': duration.toFixed(2),
        Descripción: turno.description || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos');

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 30 },
    ];

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="turnos-report-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    res.status(500).json({ message: 'Error al exportar a Excel' });
  }
});

module.exports = router;
