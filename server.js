const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const routes = require('./routes');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and allow CORS
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/', routes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MAFK API running at http://localhost:${PORT}`);
});
