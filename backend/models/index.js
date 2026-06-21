const User = require('./User');
const Items = require('./Items');
const University = require('./University');
const WhitelistedEmail = require('./WhitelistedEmail');

// Define associations
University.hasMany(User, { foreignKey: 'universityId' });
User.belongsTo(University, { foreignKey: 'universityId' });

University.hasMany(WhitelistedEmail, { foreignKey: 'universityId' });
WhitelistedEmail.belongsTo(University, { foreignKey: 'universityId' });

// Add more associations if needed (e.g. Items to User)
// User.hasMany(Items);

module.exports = {
  User,
  Items,
  University,
  WhitelistedEmail
};
