import express from 'express';
import "dotenv/config";
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './lib/db.js';
import authRoutes from './routes/auth.route.js';
import chatRoutes from './routes/chat.route.js';
import { initSocket } from './lib/socket.js';

const app = express();
const server = http.createServer(app);

// CORS config - cho phép mọi origin vì đã có nginx proxy
// Trong production, frontend và backend cùng domain qua nginx
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost (dev) and production origin
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost',
      allowedOrigin
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Connect to database
await connectDB();
if (process.env.NODE_ENV !== 'production') {
  console.log('DB:', process.env.DATABASE_URI);
}

// Initialize Socket.io
initSocket(server, { corsOrigin: allowedOrigin });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Start server
server.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
