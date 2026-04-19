const sequelize = require('../config/database');
const User = require('./User');
const Turno = require('./Turno');

// Asociaciones
User.hasMany(Turno, { foreignKey: 'employeeId', as: 'turnos' });
Turno.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' });

module.exports = {
  sequelize,
  User,
  Turno,
};