// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import morgan from 'morgan';
// import authRoutes from './routes/auth.js';
// import errorHandler from './middleware/errorHandler.js';
// import { initializeDatabase } from './dbFactory.js';

// // Load environment variables
// dotenv.config();

// const app = express();

// // Initialize database
// await initializeDatabase();

// // Middleware
// app.use(helmet()); // Security headers
// app.use(cors({
//   origin: process.env.ALLOWED_ORIGINS?.split(','),
//   methods: ['GET', 'POST', 'OPTIONS'],
//   credentials: true
// }));
// app.use(express.json());
// app.use(morgan('combined')); // Logging

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use(limiter);

// // Routes
// app.use('/api/auth', authRoutes);

// app.get('/', (req, res) => {
//   res.send('¡Hola desde la API auth!');
// });


// // Error handling middleware
// app.use(errorHandler);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import errorHandler from './middleware/errorHandler.js';
import { initializeDatabase } from './dbFactory.js';

// Load environment variables
dotenv.config();

const app = express();

// Función principal async
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(','),
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true
    }));
    app.use(express.json());
    app.use(morgan('combined'));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    app.use(limiter);

    // Routes
    app.use('/api/auth', authRoutes);
    app.get('/', (req, res) => {
      res.send('¡Hola desde la API auth!');
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use(errorHandler);

    const PORT = process.env.PORT || 3000;
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();