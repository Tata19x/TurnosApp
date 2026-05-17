const express = require('express');
const { Op } = require('sequelize');
const { Turno, User, sequelize } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const validateTurnoData = async ({ employeeId, date, startTime, endTime }) => {
  if (!employeeId || !date || !startTime || !endTime) {
    return 'Todos los campos son requeridos';
  }

  const turnoDate = parseLocalDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (turnoDate < today) {
    return 'No se permiten fechas pasadas';
  }

  if (endTime <= startTime) {
    return 'La hora de fin debe ser mayor a la hora de inicio';
  }

  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const durationHours = (end - start) / (1000 * 60 * 60);

  if (durationHours > 12) {
    return 'La duracion maxima permitida es de 12 horas';
  }

  const employee = await User.findByPk(employeeId);
  if (!employee || employee.role !== 'employee') {
    return 'Empleado no valido';
  }

  return null;
};

// GET /api/turnos - Obtener turnos (admin ve todos, employee ve solo los suyos)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { employeeId: req.user.id };

    const turnos = await Turno.findAll({
      where,
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email']
      }],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });

    res.json(turnos);
  } catch (error) {
    console.error('Error obteniendo turnos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// GET /api/turnos/:id - Obtener turno específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const turno = await Turno.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // Verificar permisos: admin puede ver todos, employee solo los suyos
    if (req.user.role !== 'admin' && turno.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    res.json(turno);
  } catch (error) {
    console.error('Error obteniendo turno:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// POST /api/turnos - Crear turno (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { employeeId, date, startTime, endTime, description } = req.body;

  // Validaciones de negocio
  if (!employeeId || !date || !startTime || !endTime) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    // Validación: fecha no pasada
    const turnoDate = parseLocalDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (turnoDate < today) {
      return res.status(400).json({ message: 'No se permiten fechas pasadas' });
    }

    // Validación: hora fin > hora inicio
    if (endTime <= startTime) {
      return res.status(400).json({ message: 'La hora de fin debe ser mayor a la hora de inicio' });
    }

    // Validación: duración máxima razonable (12 horas)
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationHours = (end - start) / (1000 * 60 * 60);

    if (durationHours > 12) {
      return res.status(400).json({ message: 'La duración máxima permitida es de 12 horas' });
    }

    // Validación: no duplicados (mismo empleado, fecha, horario)
    const existingTurno = await Turno.findOne({
      where: {
        employeeId,
        date,
        startTime,
        endTime
      }
    });

    if (existingTurno) {
      return res.status(400).json({ message: 'Ya existe un turno con el mismo horario para este empleado' });
    }

    // Validación: empleado existe
    const employee = await User.findByPk(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(400).json({ message: 'Empleado no válido' });
    }

    // Crear turno
    const turno = await Turno.create({
      employeeId,
      date,
      startTime,
      endTime,
      description: description || null
    });

    // Obtener turno con datos del empleado
    const turnoConEmpleado = await Turno.findByPk(turno.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json(turnoConEmpleado);
  } catch (error) {
    console.error('Error creando turno:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ya existe un turno con el mismo horario' });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// POST /api/turnos/bulk - Crear varios turnos en una sola operacion (solo admin)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  const { turnos } = req.body;

  if (!Array.isArray(turnos) || turnos.length === 0) {
    return res.status(400).json({ message: 'Debes enviar al menos un turno' });
  }

  const normalizedTurnos = turnos.map((turno) => ({
    employeeId: parseInt(turno.employeeId, 10),
    date: turno.date,
    startTime: turno.startTime,
    endTime: turno.endTime,
    description: turno.description || null,
  }));

  try {
    const seen = new Set();
    for (const turno of normalizedTurnos) {
      const validationError = await validateTurnoData(turno);
      if (validationError) {
        return res.status(400).json({ message: `${validationError}: ${turno.date || 'sin fecha'}` });
      }

      const key = `${turno.employeeId}-${turno.date}-${turno.startTime}-${turno.endTime}`;
      if (seen.has(key)) {
        return res.status(400).json({ message: `Hay turnos duplicados en la recurrencia para ${turno.date}` });
      }
      seen.add(key);
    }

    const existingTurno = await Turno.findOne({
      where: {
        [Op.or]: normalizedTurnos.map((turno) => ({
          employeeId: turno.employeeId,
          date: turno.date,
          startTime: turno.startTime,
          endTime: turno.endTime,
        })),
      },
    });

    if (existingTurno) {
      return res.status(400).json({
        message: `Ya existe un turno con el mismo horario para este empleado en ${existingTurno.date}`,
      });
    }

    const createdTurnos = await sequelize.transaction(async (transaction) => {
      return Turno.bulkCreate(normalizedTurnos, { transaction });
    });

    const createdIds = createdTurnos.map((turno) => turno.id);
    const turnosConEmpleado = await Turno.findAll({
      where: { id: createdIds },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email'],
      }],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    res.status(201).json(turnosConEmpleado);
  } catch (error) {
    console.error('Error creando turnos recurrentes:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ya existe un turno con el mismo horario' });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// PUT /api/turnos/:id - Actualizar turno (solo admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { employeeId, date, startTime, endTime, description } = req.body;

  try {
    const turno = await Turno.findByPk(req.params.id);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // Validaciones de negocio (iguales que en POST)
    if (date) {
      const turnoDate = parseLocalDate(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (turnoDate < today) {
        return res.status(400).json({ message: 'No se permiten fechas pasadas' });
      }
    }

    if (startTime && endTime && endTime <= startTime) {
      return res.status(400).json({ message: 'La hora de fin debe ser mayor a la hora de inicio' });
    }

    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const durationHours = (end - start) / (1000 * 60 * 60);

      if (durationHours > 12) {
        return res.status(400).json({ message: 'La duración máxima permitida es de 12 horas' });
      }
    }

    // Validación de duplicados (excluyendo el turno actual)
    if (employeeId && date && startTime && endTime) {
      const existingTurno = await Turno.findOne({
        where: {
          employeeId,
          date,
          startTime,
          endTime,
          id: { [Op.ne]: req.params.id }
        }
      });

      if (existingTurno) {
        return res.status(400).json({ message: 'Ya existe un turno con el mismo horario para este empleado' });
      }
    }

    // Validación: empleado existe si se cambia
    if (employeeId) {
      const employee = await User.findByPk(employeeId);
      if (!employee || employee.role !== 'employee') {
        return res.status(400).json({ message: 'Empleado no válido' });
      }
    }

    // Actualizar turno
    await turno.update({
      employeeId: employeeId || turno.employeeId,
      date: date || turno.date,
      startTime: startTime || turno.startTime,
      endTime: endTime || turno.endTime,
      description: description !== undefined ? description : turno.description
    });

    // Obtener turno actualizado con datos del empleado
    const turnoActualizado = await Turno.findByPk(turno.id, {
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json(turnoActualizado);
  } catch (error) {
    console.error('Error actualizando turno:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ya existe un turno con el mismo horario' });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// DELETE /api/turnos/:id - Eliminar turno (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const turno = await Turno.findByPk(req.params.id);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    await turno.destroy();
    res.json({ message: 'Turno eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando turno:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
