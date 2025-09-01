import express from 'express';
import "dotenv/config";
import http from 'http';
import connectDB from './lib/db.js';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';

const app = express();
const server = http.createServer(app);

app.use(cors()); 
app.use(express.json()); 

//Connect to database
await connectDB();

// Routes
app.use('/api/auth', authRoutes);


// Start server
server.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});