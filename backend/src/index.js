import express from 'express';

const app = express();
const PORT = 3000;

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'TeleBox API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});