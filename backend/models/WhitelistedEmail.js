const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WhitelistedEmail = sequelize.define('WhitelistedEmail', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  universityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'whitelisted_emails',
  timestamps: true,
});

module.exports = WhitelistedEmail;
