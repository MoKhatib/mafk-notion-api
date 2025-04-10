const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const {
  notion,
  PROJECTS_DB,
  TASKS_DB,
  VISUAL_DB,
  withRetry,
  DEFAULT_OWNER_ID
} = require('./notion');

const { createProject, createTask } = require('./create');
const { updateProject, updateTask, updateTaskStatus } = require('./update');
const { fetchProjects, fetchTasks } = require('./fetch');
const { deletePage } = require('./delete');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

/* ──────────────── Projects ──────────────── */

app.get('/projects', async (req, res) => {
  try {
    const projects = await fetchProjects();
    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/projects', async (req, res) => {
  const { name, status, description, client } = req.body;
  try {
    const result = await createProject(name, status, description, client);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Project creation failed' });
  }
});

app.patch('/projects/:id', async (req, res) => {
  try {
    const updated = await updateProject(req.params.id, req.body);
    res.json({ updated });
  } catch {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

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
      due: task.properties.Due?.date?.start || '',
      assignee: task.properties.Assignee?.people?.map(p => p.name) || []
    }));

    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Could not retrieve tasks for this project' });
  }
});

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

    const scheduled = tasks.filter(t => !!t.due);
    const unscheduled = tasks.filter(t => !t.due);
    const sorted = scheduled.sort((a, b) => new Date(a.due) - new Date(b.due));

    res.json({ scheduled: sorted, unscheduled, total: tasks.length });
  } catch {
    res.status(500).json({ error: 'Failed to generate project schedule' });
  }
});

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

  if (!children.length) return res.status(400).json({ error: 'No blocks to embed' });

  try {
    await withRetry(() =>
      notion.blocks.children.append({ block_id: projectId, children })
    );
    res.json({ inserted: children.length });
  } catch {
    res.status(500).json({ error: 'Failed to embed creative dashboard' });
  }
});

app.post('/projects/:id/embed-moodboard', async (req, res) => {
  const { title, description, visuals = [] } = req.body;
  const projectId = req.params.id;

  const children = [
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: `🖼️ ${title}` } }],
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: description } }]
            }
          },
          ...visuals.map(v => ({
            object: 'block',
            type: 'image',
            image: {
              type: 'external',
              external: { url: v.img }
            }
          }))
        ]
      }
    }
  ];

  try {
    await withRetry(() =>
      notion.blocks.children.append({ block_id: projectId, children })
    );
    res.json({ inserted: true });
  } catch {
    res.status(500).json({ error: 'Failed to embed moodboard' });
  }
});

app.post('/projects/:id/clean-blocks', async (req, res) => {
  const projectId = req.params.id;
  try {
    const response = await notion.blocks.children.list({ block_id: projectId });
    const toggleBlocks = response.results.filter(
      block => block.type === 'toggle' && block.toggle?.rich_text?.[0]?.text?.content
    );

    const seen = {};
    const duplicates = [];

    for (const block of toggleBlocks) {
      const title = block.toggle.rich_text[0].text.content.trim();
      if (seen[title]) {
        duplicates.push({ block_id: block.id, title });
      } else {
        seen[title] = block.id;
      }
    }

    res.json({ duplicates });
  } catch {
    res.status(500).json({ error: 'Failed to detect duplicate blocks' });
  }
});

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
      image: v.properties.Image?.files?.[0]?.file?.url || '',
      tags: v.properties.Tags?.multi_select?.map(t => t.name) || []
    }));

    res.json(visuals);
  } catch {
    res.status(500).json({ error: 'Failed to get visual references' });
  }
});

/* ──────────────── Visual References ──────────────── */

app.post('/visuals/:id/tag-project', async (req, res) => {
  const visualId = req.params.id;
  const { projectId, tags = [] } = req.body;

  try {
    await withRetry(() =>
      notion.pages.update({
        page_id: visualId,
        properties: {
          Project: { relation: [{ id: projectId }] },
          Tags: { multi_select: tags.map(tag => ({ name: tag })) }
        }
      })
    );

    res.json({ linked: true });
  } catch {
    res.status(500).json({ error: 'Failed to tag visual reference' });
  }
});

/* ──────────────── Tasks ──────────────── */

app.get('/tasks', async (req, res) => {
  try {
    const tasks = await fetchTasks();
    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/tasks', async (req, res) => {
  const { name, projectId, status, priority, due, assignee } = req.body;

  try {
    const task = await createTask(name, projectId, status, assignee, priority, due);
    res.json(task);
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/tasks/:id/status', async (req, res) => {
  try {
    await updateTaskStatus(req.params.id, req.body.status);
    res.json({ updated: true });
  } catch {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.patch('/tasks/:id', async (req, res) => {
  try {
    await updateTask(req.params.id, req.body);
    res.json({ updated: true });
  } catch {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/pages/:id', async (req, res) => {
  try {
    await deletePage(req.params.id);
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Failed to archive page' });
  }
});

/* ──────────────── Run Server ──────────────── */

app.listen(PORT, () => {
  console.log(`🧠 MAFK API running on port ${PORT}`);
});
