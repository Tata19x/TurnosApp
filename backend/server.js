const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);

// Sincronizar base de datos y crear admin inicial
const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // Cambiar a true si quieres resetear la DB

    // Crear admin inicial si no existe
    const adminExists = await sequelize.models.User.findOne({ where: { email: 'admin@turnosapp.com' } });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await sequelize.models.User.create({
        name: 'Admin Inicial',
        email: 'admin@turnosapp.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin inicial creado: admin@turnosapp.com / admin123');
    }

    console.log('Base de datos sincronizada');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
};

// Inicializar DB y luego iniciar servidor
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});