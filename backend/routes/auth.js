const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Registro de empleados (solo admin)
router.post('/register-employee', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña requeridos' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role: 'employee' });

    res.status(201).json({ message: 'Empleado registrado exitosamente', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener todos los empleados (solo admin)
router.get('/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: ['id', 'name', 'email', 'role'],
      order: [['name', 'ASC']]
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
});

// Actualizar empleado (solo admin)
router.put('/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Nombre y email son requeridos' });
  }

  try {
    const employee = await User.findOne({ where: { id: parseInt(id), role: 'employee' } });
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await User.findOne({ where: { email, id: { [require('sequelize').Op.ne]: parseInt(id) } } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email ya registrado por otro usuario' });
    }

    await employee.update({ name, email });
    res.json({ message: 'Empleado actualizado exitosamente', user: { id: employee.id, name: employee.name, email: employee.email, role: employee.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar empleado' });
  }
});

// Eliminar empleado (solo admin)
router.delete('/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await User.findOne({ where: { id: parseInt(id), role: 'employee' } });
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    // Verificar si el empleado tiene turnos asignados
    const { Turno } = require('../models');
    const turnosCount = await Turno.count({ where: { employeeId: id } });

    if (turnosCount > 0) {
      return res.status(400).json({ message: 'No se puede eliminar el empleado porque tiene turnos asignados' });
    }

    await employee.destroy();
    res.json({ message: 'Empleado eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar empleado' });
  }
});

module.exports = router;