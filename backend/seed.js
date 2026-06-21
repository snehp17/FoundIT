require('dotenv').config();
const { sequelize } = require('./config/db');
const { User, University, WhitelistedEmail } = require('./models');

const seedDatabase = async () => {
  try {
    // Sync models
    await sequelize.sync({ force: true }); // This will DROP all tables and recreate them cleanly
    console.log('Database synced and cleared.');

    // 1. Create Universities
    const parul = await University.create({ name: 'Parul University', location: 'Vadodara' });
    const itm = await University.create({ name: 'ITM SLS University', location: 'Vadodara' });
    console.log('Universities created.');

    // 2. Create University Admins
    await User.create({
      name: 'Parul Admin',
      email: 'admin@parul.ac.in',
      password: 'password123',
      role: 'university_admin',
      universityId: parul.id
    });

    await User.create({
      name: 'ITM Admin',
      email: 'admin@itm.ac.in',
      password: 'password123',
      role: 'university_admin',
      universityId: itm.id
    });
    console.log('University Admins created.');

    // 3. Whitelist Some Student Emails
    await WhitelistedEmail.create({ email: 'priya.sharma@parul.ac.in', universityId: parul.id });
    await WhitelistedEmail.create({ email: 'rahul.verma@parul.ac.in', universityId: parul.id });
    await WhitelistedEmail.create({ email: 'amit.patel@itm.ac.in', universityId: itm.id });
    console.log('Student emails whitelisted.');

    // 4. Create Some Students
    await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@parul.ac.in',
      password: 'studentpassword',
      role: 'student',
      universityId: parul.id
    });

    await User.create({
      name: 'Amit Patel',
      email: 'amit.patel@itm.ac.in',
      password: 'studentpassword',
      role: 'student',
      universityId: itm.id
    });
    console.log('Student accounts created.');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
