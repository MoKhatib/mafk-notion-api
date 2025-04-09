// server.js
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');
const { fetchProjects } = require('./fetch');
const { createProject, createTask } = require('./create');
const { updateTaskStatus, updateProject } = require('./update');
const { deletePage } = require('./delete');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 🔹 Get all projects
app.get('/projects', async (req, res) => {
  try {
    const projects = await fetchProjects();
    res.json(projects);
  } catch (error) {
    console.error('❌ Failed to fetch projects:', error.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 🔹 Get all tasks
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

// 🔹 Create project
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

// 🔹 Create task
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

// 🔹 Update only task status
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

// ✅ NEW: Update full task
app.patch('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const { name, status, priority, due, assignee } = req.body;

  const properties = {};

  if (name) {
    properties['Task name'] = {
      title: [{ text: { content: name } }],
    };
  }

  if (status) {
    properties['Status'] = {
      status: { name: status },
    };
  }

  if (priority) {
    properties['Priority'] = {
      select: { name: priority },
    };
  }

  if (due) {
    properties['Due'] = {
      date: { start: due },
    };
  }

  if (assignee && Array.isArray(assignee)) {
    properties['Assignee'] = {
      people: assignee.map(id => ({ id })),
    };
  }

  try {
    const response = await notion.pages.update({
      page_id: taskId,
      properties,
    });

    res.status(200).json({ message: 'Task updated', task: response });
  } catch (error) {
    console.error('❌ Failed to update task:', error.message);
    res.status(500).json({ error: 'Task update failed' });
  }
});

// 🔹 Delete (archive) page
app.delete('/pages/:id', async (req, res) => {
  try {
    await deletePage(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    console.error('❌ Failed to delete page:', error.message);
    res.status(500).json({ error: 'Delete operation failed' });
  }
});

// ✅ NEW: Get single project
app.get('/projects/:id', async (req, res) => {
  try {
    const response = await notion.pages.retrieve({
      page_id: req.params.id,
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Failed to fetch project by ID:', error.message);
    res.status(500).json({ error: 'Could not retrieve project.' });
  }
});

// ✅ NEW: Get single task
app.get('/tasks/:id', async (req, res) => {
  try {
    const response = await notion.pages.retrieve({
      page_id: req.params.id,
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Failed to fetch task by ID:', error.message);
    res.status(500).json({ error: 'Could not retrieve task.' });
  }
});

// 🔹 Update project metadata
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

app.listen(PORT, () => console.log(`🚀 MAFK API running on port ${PORT}`));
