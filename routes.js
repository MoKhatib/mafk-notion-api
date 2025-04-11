const express = require('express');
const router = express.Router();

const { createProject, createTask } = require('./create');
const { notion, withRetry } = require('./notion');
const {
  generateImageCaption,
  generateTaskBrief,
  classifyTaskBrief
} = require('./utils');
const { adoptTemplate } = require('./adopt');
const fetch = require('node-fetch');


// ✅ HEALTH CHECK
router.get('/', (req, res) => {
  res.send('✅ MAFK API is alive');
});

// ✅ CREATE NEW PROJECT + APPLY TEMPLATE
router.post('/projects', async (req, res) => {
  try {
    const { name, status, description, client } = req.body;
    const project = await createProject(name, status, description, client);
    res.status(200).json({ success: true, project });
  } catch (err) {
    console.error('❌ Project creation failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ CREATE TASK
router.post('/tasks', async (req, res) => {
  const { name, projectId, status, assignee, priority, due } = req.body;
  if (!name || !projectId)
    return res.status(400).json({ error: 'Task name and projectId required.' });

  try {
    const task = await createTask(name, projectId, status, assignee, priority, due);
    res.status(200).json({ success: true, task });
  } catch (err) {
    console.error('❌ Task creation failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GPT BRIEF + CATEGORY → SPRINT
router.post('/projects/:id/sprint', async (req, res) => {
  const { tasks = [], days = 5, startDate } = req.body;
  const projectId = req.params.id;
  const start = new Date(startDate || new Date());
  const createdTasks = [];

  try {
    for (let i = 0; i < tasks.length; i++) {
      const due = new Date(start);
      due.setDate(start.getDate() + (i % days));

      const taskPage = await withRetry(() =>
        notion.pages.create({
          parent: { database_id: process.env.TASKS_DB_ID },
          properties: {
            Name: { title: [{ text: { content: tasks[i] } }] },
            Status: { status: { name: 'Not Started' } },
            Due: { date: { start: due.toISOString().split('T')[0] } },
            Project: { relation: [{ id: projectId }] }
          }
        })
      );

      const brief = await generateTaskBrief(tasks[i]);
      const category = classifyTaskBrief(brief);

      await withRetry(() =>
        notion.pages.update({
          page_id: taskPage.id,
          properties: {
            Category: { select: { name: category } }
          }
        })
      );

      await withRetry(() =>
        notion.blocks.children.append({
          block_id: taskPage.id,
          children: [{
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
          }]
        })
      );

      createdTasks.push({ name: tasks[i], brief, category });
    }

    res.status(200).json({ success: true, tasks: createdTasks });
  } catch (err) {
    console.error('❌ Sprint creation failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GENERATE SPRINT TASKS FROM GOAL
router.post('/projects/:id/generate-sprint-from-goal', async (req, res) => {
  const { goal } = req.body;
  const projectId = req.params.id;
  if (!goal) return res.status(400).json({ error: 'Goal is required.' });

  const prompt = `You're an AI creative producer. Break this into 5–7 sprint tasks:\n"${goal}"`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  const data = await response.json();
  const tasks = data.choices?.[0]?.message?.content
    ?.split('\n')
    .map(t => t.replace(/^\d+\.\s*/, ''))
    .filter(Boolean);

  const sprintRes = await fetch(`http://localhost:3000/projects/${projectId}/sprint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks })
  });

  const result = await sprintRes.json();

  res.status(200).json({
    success: true,
    tasksGenerated: tasks,
    sprint: result
  });
});

// ✅ IMAGE CAPTIONING
router.post('/pages/:id/caption-images', async (req, res) => {
  try {
    const blocks = await withRetry(() =>
      notion.blocks.children.list({ block_id: req.params.id })
    );

    const imageBlocks = blocks.results.filter(b => b.type === 'image');
    const captions = [];

    for (const block of imageBlocks) {
      const url = block.image?.external?.url || block.image?.file?.url;
      if (!url) continue;

      const caption = await generateImageCaption({ imageUrl: url, pageTitle: 'Visual' });

      await withRetry(() =>
        notion.blocks.children.append({
          block_id: block.id,
          children: [{
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: caption } }]
            }
          }]
        })
      );

      captions.push({ blockId: block.id, caption });
    }

    res.status(200).json({ success: true, captions });
  } catch (err) {
    console.error('❌ Image captioning failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DAILY REFLECTION BLOCK
router.post('/projects/:id/daily-reflection', async (req, res) => {
  const projectId = req.params.id;

  try {
    const taskRes = await withRetry(() =>
      notion.databases.query({
        database_id: process.env.TASKS_DB_ID,
        filter: {
          and: [
            { property: 'Project', relation: { contains: projectId } },
            { property: 'Status', status: { does_not_equal: 'Done' } }
          ]
        }
      })
    );

    const now = new Date().toISOString().split('T')[0];
    const overdue = taskRes.results.filter(t => {
      const date = t.properties?.Due?.date?.start;
      return date && date < now;
    });

    const today = new Date().toLocaleDateString();
    const report = `🧠 Daily Reflection – ${today}\n\nOpen Tasks: ${taskRes.results.length}\nOverdue: ${overdue.length}`;

    await withRetry(() =>
      notion.blocks.children.append({
        block_id: projectId,
        children: [{
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ type: 'text', text: { content: `📆 Daily Reflection (${today})` } }],
            children: [{
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ type: 'text', text: { content: report } }]
              }
            }]
          }
        }]
      })
    );

    res.status(200).json({ success: true, reflection: report });
  } catch (err) {
    console.error('❌ Reflection failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
