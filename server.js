const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');
const { fetchProjects, fetchTasks } = require('./fetch');
const { createProject, createTask } = require('./create');
const { updateTaskStatus, updateProject } = require('./update');
const { deletePage } = require('./delete');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 🔹 Fetch all projects
app.get('/projects', async (req, res) => {
  try {
    const projects = await fetchProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 🔹 Fetch all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await fetchTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ✅ Fetch all tasks under a specific project
app.get('/projects/:id/tasks', async (req, res) => {
  const projectId = req.params.id;
  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB,
      filter: {
        property: 'Project',
        relation: {
          contains: projectId
        }
      }
    });
    const tasks = response.results.map(task => ({
      id: task.id,
      name: task.properties.Name?.title?.[0]?.plain_text || '',
      status: task.properties.Status?.status?.name || '',
      priority: task.properties.Priority?.select?.name || '',
      due: task.properties.Due?.date?.start || '',
      assignee: task.properties.Assignee?.people?.map(p => p.name) || []
    }));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve tasks for this project' });
  }
});

// ✅ Get all tasks due this week
app.get('/tasks/this-week', async (req, res) => {
  const today = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(today.getDate() + 7);

  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB,
      filter: {
        and: [
          {
            property: 'Due',
            date: {
              on_or_after: today.toISOString().split('T')[0]
            }
          },
          {
            property: 'Due',
            date: {
              on_or_before: endOfWeek.toISOString().split('T')[0]
            }
          }
        ]
      }
    });

    const tasks = response.results.map(task => ({
      id: task.id,
      name: task.properties.Name?.title?.[0]?.plain_text || '',
      due: task.properties.Due?.date?.start || '',
      project: task.properties.Project?.relation?.[0]?.id || '',
      status: task.properties.Status?.status?.name || ''
    }));

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve tasks for this week' });
  }
});

// 🔹 Create a new project
app.post('/projects', async (req, res) => {
  const { name, status, description } = req.body;
  try {
    const result = await createProject(name, status, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Project creation failed' });
  }
});

// 🔹 Create a new task
app.post('/tasks', async (req, res) => {
  const { name, projectId, status, priority, due, assignee } = req.body;
  try {
    const result = await createTask(name, projectId, status, assignee || [], priority, due);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Task creation failed' });
  }
});

// 🔹 Update task status
app.patch('/tasks/:id/status', async (req, res) => {
  try {
    await updateTaskStatus(req.params.id, req.body.status);
    res.json({ updated: true });
  } catch (error) {
    res.status(500).json({ error: 'Task status update failed' });
  }
});

// ✅ Update full project metadata
app.patch('/projects/:id', async (req, res) => {
  const { description, deadline, url, owner, status, client } = req.body;
  try {
    const updated = await updateProject(req.params.id, { description, deadline, url, owner, status, client });
    res.json({ updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ✅ Embed content block inside Notion page
app.post('/projects/:id/embed-summary', async (req, res) => {
  const { summary, goals, ideas } = req.body;
  const projectId = req.params.id;
  const children = [];

  if (summary) {
    children.push({
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '📄 Project Summary' } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: summary } }]
          }
        }]
      }
    });
  }

  if (goals) {
    children.push({
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🎯 Goals & Objectives' } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: goals } }]
          }
        }]
      }
    });
  }

  if (ideas) {
    children.push({
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '💡 Creative Concepts' } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: ideas } }]
          }
        }]
      }
    });
  }

  try {
    const response = await notion.blocks.children.append({
      block_id: projectId,
      children
    });

    res.json({ inserted: children.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to embed content block' });
  }
});

// 🔹 Archive (soft delete) a page
app.delete('/pages/:id', async (req, res) => {
  try {
    await deletePage(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive page' });
  }
});

app.listen(PORT, () => console.log(`🚀 MAFK Notion API running on port ${PORT}`));
