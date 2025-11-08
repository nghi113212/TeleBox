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

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: allowedOrigin, credentials: true }));
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
