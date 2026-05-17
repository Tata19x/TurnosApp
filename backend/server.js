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
const reportsRoutes = require('./routes/reports');
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/reports', reportsRoutes);

const cleanupSqliteTempTables = async () => {
  await sequelize.query('DROP TABLE IF EXISTS Users_backup');
  await sequelize.query('DROP TABLE IF EXISTS Turnos_backup');
  await sequelize.query('DROP TABLE IF EXISTS Turnos_rebuild');
};

const ensureUserColumns = async () => {
  const [columns] = await sequelize.query("PRAGMA table_info('Users')");
  const existingColumns = new Set(columns.map((column) => column.name));
  const missingColumns = [
    ['document', 'VARCHAR(255)'],
    ['phone', 'VARCHAR(255)'],
    ['address', 'VARCHAR(255)'],
    ['resetToken', 'VARCHAR(255)'],
    ['resetTokenExpiry', 'DATETIME'],
  ].filter(([name]) => !existingColumns.has(name));

  for (const [name, type] of missingColumns) {
    await sequelize.query(`ALTER TABLE Users ADD COLUMN ${name} ${type}`);
  }
};

const repairTurnosUniqueIndexes = async () => {
  const [indexes] = await sequelize.query("PRAGMA index_list('Turnos')");
  const badUniqueIndexes = [];

  for (const index of indexes) {
    const [columns] = await sequelize.query(`PRAGMA index_info('${index.name}')`);
    const isBadSingleColumnUnique =
      index.unique === 1 &&
      columns.length === 1 &&
      ['employeeId', 'date', 'startTime', 'endTime'].includes(columns[0].name);

    if (isBadSingleColumnUnique) {
      badUniqueIndexes.push(index.name);
    }
  }

  if (badUniqueIndexes.length === 0) {
    return;
  }

  await sequelize.query('PRAGMA foreign_keys = OFF');
  await sequelize.transaction(async (transaction) => {
    await sequelize.query('DROP TABLE IF EXISTS Turnos_rebuild', { transaction });
    await sequelize.query(`
      CREATE TABLE Turnos_rebuild (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER NOT NULL REFERENCES Users(id),
        date DATE NOT NULL,
        startTime TIME NOT NULL,
        endTime TIME NOT NULL,
        description VARCHAR(255),
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `, { transaction });

    await sequelize.query(`
      INSERT INTO Turnos_rebuild (id, employeeId, date, startTime, endTime, description, createdAt, updatedAt)
      SELECT id, employeeId, date, startTime, endTime, description, createdAt, updatedAt
      FROM Turnos
    `, { transaction });

    await sequelize.query('DROP TABLE Turnos', { transaction });
    await sequelize.query('ALTER TABLE Turnos_rebuild RENAME TO Turnos', { transaction });
    await sequelize.query(`
      CREATE UNIQUE INDEX turnos_employee_id_date_start_time_end_time
      ON Turnos (employeeId, date, startTime, endTime)
    `, { transaction });
  });
  await sequelize.query('PRAGMA foreign_keys = ON');

  console.log('Indices de Turnos reparados');
};

// Sincronizar base de datos y crear admin inicial
const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    await cleanupSqliteTempTables();
    await ensureUserColumns();
    await repairTurnosUniqueIndexes();

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
