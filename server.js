const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');
const { fetchProjects } = require('./fetch');
const { createProject, createTask } = require('./create');
const { updateTaskStatus } = require('./update');
const { deletePage } = require('./delete');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

/**
 * GET /projects
 * Fetch all projects from Notion Projects DB
 */
app.get('/projects', async (req, res) => {
  try {
    const projects = await fetchProjects();
    res.json(projects);
  } catch (error) {
    console.error('❌ Failed to fetch projects:', error.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /tasks
 * Fetch all tasks from Notion Tasks DB
 */
app.get('/tasks', async (req, res) => {
  try {
    const response = await notion.databases.query({ database_id: TASKS_DB });
    const tasks = response.results.map(page => ({
      id: page.id,
      name: page.properties['Task name']?.title?.[0]?.plain_text ?? 'Untitled',
      status: page.properties.Status?.status?.name ?? 'Unknown',
      due: page.properties.Due?.date?.start ?? null,
      priority: page.properties.Priority?.select?.name ?? null
    }));
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /projects
 * Create a new project
 */
app.post('/projects', async (req, res) => {
  const { name, status, description } = req.body;
  try {
    const result = await createProject(name, status, description);
    res.json(result);
  } catch (error) {
    console.error('❌ Failed to create project:', error.message);
    res.status(500).json({ error: 'Project creation failed' });
  }
});

/**
 * POST /tasks
 * Create a new task under a project
 */
app.post('/tasks', async (req, res) => {
  const { name, projectId, status, priority, due, assignee } = req.body;
  try {
    const result = await createTask(name, projectId, status, assignee || [], priority, due);
    res.json(result);
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
    res.status(500).json({ error: 'Task creation failed' });
  }
});

/**
 * PATCH /tasks/:id/status
 * Update task status
 */
app.patch('/tasks/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await updateTaskStatus(req.params.id, status);
    res.json({ updated: true });
  } catch (error) {
    console.error('❌ Failed to update task:', error.message);
    res.status(500).json({ error: 'Task status update failed' });
  }
});

/**
 * DELETE /pages/:id
 * Soft-delete (archive) any page
 */
app.delete('/pages/:id', async (req, res) => {
  try {
    await deletePage(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    console.error('❌ Failed to delete page:', error.message);
    res.status(500).json({ error: 'Delete operation failed' });
  }
});

app.listen(PORT, () => console.log(`🚀 MAFK API running on port ${PORT}`));

// PATCH /projects/:id → Update Notion project
app.patch('/projects/:id', async (req, res) => {
  const projectId = req.params.id;
  const { deadline, url, owner, description } = req.body;

  try {
    const updated = await updateProject(projectId, { deadline, url, owner, description });
    res.status(200).json({ message: 'Project updated', updated });
  } catch (error) {
    console.error('❌ Error updating project:', error.message);
    res.status(500).json({ error: error.message });
  }
});
