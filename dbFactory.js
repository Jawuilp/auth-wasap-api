import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { createClient } from '@supabase/supabase-js';
import defineUserPostgres from './models/UserPostgres.js';

let dbInstance = null;
let supabaseInstance = null;

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

async function initializeSupabase() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Connected to Supabase');
    return supabase;
  } catch (err) {
    console.error('Supabase connection error:', err);
    throw err;
  }
}

export async function initializeDatabase() {
  const dbType = process.env.DB_TYPE || 'mongodb';
  
  if (dbType === 'mongodb') {
    dbInstance = await initializeMongoDB();
  } else if (dbType === 'postgres') {
    dbInstance = await initializePostgres();
  } else if (dbType === 'supabase') {
    dbInstance = await initializeSupabase();
    supabaseInstance = dbInstance;
  } else {
    throw new Error('Invalid DB_TYPE. Use "mongodb", "postgres", or "supabase".');
  }
  
  return dbInstance;
}

export function getDatabaseInstance() {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
}

export function getSupabaseInstance() {
  if (!supabaseInstance) {
    throw new Error('Supabase not initialized');
  }
  return supabaseInstance;
}