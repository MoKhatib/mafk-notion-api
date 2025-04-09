const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { fetchProjects, fetchTasks } = require('./fetch');
const { createProject, createTask } = require('./create');
const { updateTaskStatus } = require('./update');
const { deletePage } = require('./delete');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Fetch all projects
app.get('/projects', async (req, res) => {
  const data = await fetchProjects();
  res.json(data);
});

// Create project
app.post('/projects', async (req, res) => {
  const { name, status } = req.body;
  const result = await createProject(name, status);
  res.json(result);
});

// Create task
app.post('/tasks', async (req, res) => {
  const { name, projectId, status } = req.body;
  const result = await createTask(name, projectId, status);
  res.json(result);
});

// Update task status
app.patch('/tasks/:id/status', async (req, res) => {
  const { status } = req.body;
  const result = await updateTaskStatus(req.params.id, status);
  res.json({ updated: true });
});

// Delete page
app.delete('/pages/:id', async (req, res) => {
  await deletePage(req.params.id);
  res.json({ deleted: true });
});

app.listen(PORT, () => console.log(`🚀 MAFK API running on port ${PORT}`));
