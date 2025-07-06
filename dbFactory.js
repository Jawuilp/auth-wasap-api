import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import defineUserPostgres from './models/UserPostgres.js';

let dbInstance = null;

async function initializeMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    return mongoose;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

async function initializePostgres() {
  try {
    const sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      logging: false,
    });
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');
    defineUserPostgres(sequelize);
    await sequelize.sync({ force: false });
    return sequelize;
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
    throw err;
  }
}

export async function initializeDatabase() {
  const dbType = process.env.DB_TYPE || 'mongodb';
  
  if (dbType === 'mongodb') {
    dbInstance = await initializeMongoDB();
  } else if (dbType === 'postgres') {
    dbInstance = await initializePostgres();
  } else {
    throw new Error('Invalid DB_TYPE. Use "mongodb" or "postgres".');
  }
  
  return dbInstance;
}

export function getDatabaseInstance() {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
}