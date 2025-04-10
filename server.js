// server.js
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
    console.error('❌ Failed to fetch projects:', error.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 🔹 Fetch all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await fetchTasks();
    res.json(tasks);
  } catch (error) {
    console.error('❌ Failed to fetch tasks:', error.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 🔹 Create new project
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

// 🔹 Create new task
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

// 🔹 Update task status only
app.patch('/tasks/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await updateTaskStatus(req.params.id, status);
    res.json({ updated: true });
  } catch (error) {
    console.error('❌ Failed to update task status:', error.message);
    res.status(500).json({ error: 'Task status update failed' });
  }
});

// ✅ Update full project metadata (new route)
app.patch('/projects/:id', async (req, res) => {
  const projectId = req.params.id;
  const { description, deadline, url, owner, status } = req.body;

  try {
    const updated = await updateProject(projectId, { description, deadline, url, owner, status });
    res.status(200).json({ message: 'Project updated', updated });
  } catch (error) {
    console.error('❌ Error updating project:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Embed summary into Notion page body (new route)
app.post('/projects/:id/embed-summary', async (req, res) => {
  const projectId = req.params.id;
  const { summary, goals, ideas } = req.body;

  try {
    const children = [];

    if (summary) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '📄 Project Summary' } }] }
      });
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: summary } }] }
      });
    }

    if (goals) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '🎯 Goals & Objectives' } }] }
      });
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: goals } }] }
      });
    }

    if (ideas) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '💡 Creative Concepts' } }] }
      });
      children.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: ideas } }]
        }
      });
    }

    const response = await notion.blocks.children.append({
      block_id: projectId,
      children
    });

    res.status(200).json({ success: true, inserted: children.length });
  } catch (error) {
    console.error('❌ Failed to embed project content:', error.message);
    res.status(500).json({ error: 'Failed to embed project summary' });
  }
});

// 🔹 Delete/archive page
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
