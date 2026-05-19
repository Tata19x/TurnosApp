const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Turno, sequelize } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');


const router = express.Router();

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

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
  const { name, email, password, document, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña requeridos' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: 'employee',
      document: document || null,
      phone: phone || null,
      address: address || null
    });

    res.status(201).json({ 
      message: 'Empleado registrado exitosamente', 
      user: { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        document: newUser.document,
        phone: newUser.phone,
        address: newUser.address
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener todos los empleados (solo admin)
router.get('/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: ['id', 'name', 'email', 'role', 'document', 'phone', 'address'],
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
  const { name, email, document, phone, address } = req.body;

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

    await employee.update({ 
      name, 
      email,
      document: document || null,
      phone: phone || null,
      address: address || null
    });
    res.json({ 
      message: 'Empleado actualizado exitosamente', 
      user: { 
        id: employee.id, 
        name: employee.name, 
        email: employee.email, 
        role: employee.role,
        document: employee.document,
        phone: employee.phone,
        address: employee.address
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar empleado' });
  }
});

// Eliminar empleado (solo admin)
router.delete('/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const transaction = await sequelize.transaction();

  try {
    const employee = await User.findOne({
      where: { id: parseInt(id), role: 'employee' },
      transaction,
    });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    await Turno.destroy({ where: { employeeId: employee.id }, transaction });
    await employee.destroy({ transaction });
    await transaction.commit();

    res.json({ message: 'Empleado eliminado exitosamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ message: 'Error al eliminar empleado' });
  }
});

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email requerido' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // No revelar si el email existe por seguridad
      return res.json({ message: 'Si el email existe en el sistema, recibirá un enlace de recuperación' });
    }

    // Generar token y establecer expiración (30 minutos)
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await user.update({ resetToken, resetTokenExpiry });

    // En un caso real, aquí enviarías un email con el token
    // Por ahora, devolvemos el token en desarrollo (NUNCA en producción)
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.json({ 
      message: 'Si el email existe en el sistema, recibirá un enlace de recuperación',
      ...(isProduction ? {} : { resetToken })
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Validar token de recuperación y cambiar contraseña
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token y nueva contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ 
      where: { resetToken: token }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    // Verificar si el token ha expirado
    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: 'El token ha expirado. Por favor solicita uno nuevo' });
    }

    // Actualizar contraseña y limpiar token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ 
      password: hashedPassword, 
      resetToken: null, 
      resetTokenExpiry: null 
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener perfil del usuario actual (para empleados)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Cambiar contraseña (usuario autenticado)
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en change-password:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
