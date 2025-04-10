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

// 🧾 Notion Database ID for Visual References
const VISUAL_DB = '1d1dbda8f07f806eaf99ff83c4a87842';

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

// ✅ Fetch all tasks under a project
app.get('/projects/:id/tasks', async (req, res) => {
  const projectId = req.params.id;
  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB,
      filter: {
        property: 'Project',
        relation: { contains: projectId }
      }
    });

    const tasks = response.results.map(task => ({
      id: task.id,
      name: task.properties['Task name']?.title?.[0]?.plain_text || '',
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

// ✅ Project timeline
app.get('/projects/:id/schedule', async (req, res) => {
  const projectId = req.params.id;
  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB,
      filter: {
        property: 'Project',
        relation: { contains: projectId }
      }
    });

    const tasks = response.results.map(task => ({
      id: task.id,
      name: task.properties['Task name']?.title?.[0]?.plain_text || '',
      due: task.properties.Due?.date?.start || null,
      status: task.properties.Status?.status?.name || 'Unknown'
    }));

    const sorted = tasks.sort((a, b) => {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate project schedule' });
  }
});

// ✅ Overdue tasks
app.get('/tasks/overdue', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB,
      filter: {
        and: [
          { property: 'Due', date: { before: today } },
          { property: 'Status', status: { does_not_equal: 'Done' } }
        ]
      }
    });

    const overdue = response.results.map(task => ({
      id: task.id,
      name: task.properties['Task name']?.title?.[0]?.plain_text || '',
      due: task.properties.Due?.date?.start || '',
      status: task.properties.Status?.status?.name || '',
      project: task.properties.Project?.relation?.[0]?.id || '',
      priority: task.properties.Priority?.select?.name || ''
    }));

    res.json(overdue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve overdue tasks' });
  }
});

// ✅ Embed full creative dashboard
app.post('/projects/:id/embed-dashboard', async (req, res) => {
  const { summary, goals, ideas, planning, rituals, prompts } = req.body;
  const projectId = req.params.id;
  const children = [];

  const createToggle = (title, content) => ({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: title } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      }]
    }
  });

  if (summary) children.push(createToggle('📄 Project Summary', summary));
  if (goals) children.push(createToggle('🎯 Goals & Objectives', goals));
  if (ideas) children.push(createToggle('💡 Creative Concepts', ideas));
  if (planning) children.push(createToggle('🔧 Planning the Project', planning));
  if (rituals) children.push(createToggle('🧪 Sprint Rituals', rituals));
  if (prompts) children.push(createToggle('🪄 AI Prompts / Experiments', prompts));

  try {
    await notion.blocks.children.append({ block_id: projectId, children });
    res.json({ inserted: children.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to embed creative dashboard' });
  }
});

// ✅ Inject brief into task
app.post('/tasks/:id/brief', async (req, res) => {
  const { brief } = req.body;
  const taskId = req.params.id;

  if (!brief) return res.status(400).json({ error: 'Missing `brief` content.' });

  const block = {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: '📝 Creative Brief' } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: brief } }]
        }
      }]
    }
  };

  try {
    await notion.blocks.children.append({
      block_id: taskId,
      children: [block]
    });

    res.json({ inserted: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to embed creative brief' });
  }
});

// ✅ Detect duplicate toggle blocks
app.post('/projects/:id/clean-blocks', async (req, res) => {
  const projectId = req.params.id;

  try {
    const response = await notion.blocks.children.list({
      block_id: projectId,
      page_size: 100
    });

    const toggleBlocks = response.results.filter(block =>
      block.type === 'toggle' && block.toggle?.rich_text?.[0]?.text?.content
    );

    const seen = {};
    const duplicates = [];

    for (let block of toggleBlocks) {
      const title = block.toggle.rich_text[0].text.content.trim();
      if (seen[title]) {
        duplicates.push({
          block_id: block.id,
          title,
          created_time: block.created_time
        });
      } else {
        seen[title] = block.id;
      }
    }

    res.json({
      message: 'Duplicate toggles detected',
      total_duplicates: duplicates.length,
      duplicates
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check blocks for duplicates' });
  }
});

// ✅ Fetch visual references for a project
app.get('/projects/:id/visual-references', async (req, res) => {
  const projectId = req.params.id;

  try {
    const response = await notion.databases.query({
      database_id: VISUAL_DB,
      filter: {
        property: 'Project',
        relation: { contains: projectId }
      }
    });

    const visuals = response.results.map(v => ({
      id: v.id,
      title: v.properties.Name?.title?.[0]?.plain_text || '',
      image: v.properties.Image?.files?.[0]?.file?.url || null,
      tags: v.properties.Tags?.multi_select?.map(tag => tag.name) || [],
      source: v.properties['Source Link']?.url || null,
      promptIdeas: v.properties['Prompt Ideas']?.rich_text?.[0]?.plain_text || ''
    }));

    res.json(visuals);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch visuals for project' });
  }
});

// 🔹 Create new project
app.post('/projects', async (req, res) => {
  const { name, status, description } = req.body;
  try {
    const result = await createProject(name, status, description);
    res.json(result);
  } catch (error) {
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

// 🔹 Update project
app.patch('/projects/:id', async (req, res) => {
  const { description, deadline, url, owner, status, client } = req.body;
  try {
    const updated = await updateProject(req.params.id, {
      description, deadline, url, owner, status, client
    });
    res.json({ updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// 🔹 Archive
app.delete('/pages/:id', async (req, res) => {
  try {
    await deletePage(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive page' });
  }
});

app.listen(PORT, () => console.log(`🚀 MAFK Notion API running on port ${PORT}`));
