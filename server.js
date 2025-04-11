const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Parse JSON body payloads
app.use(bodyParser.json());

// ✅ Load API routes (projects, tasks, status)
const routes = require('./routes');
app.use('/', routes);

// ✅ Server is live
app.listen(port, () => {
  console.log(`🚀 MAFK API running at http://localhost:${port}`);
});
