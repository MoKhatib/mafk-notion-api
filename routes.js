const express = require('express');
const router = express.Router();
const notion = require('./notion');

// GET all projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await notion.getAllProjects();
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Get Projects Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST a new project
router.post('/projects', async (req, res) => {
  try {
    const { name, status, description, client } = req.body;
    const newProject = await notion.createProject({ name, status, description, client });
    res.json({ success: true, project: newProject });
  } catch (error) {
    console.error('Create Project Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST embed dashboard to project
router.post('/projects/:id/embed-dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, goals, ideas, planning, rituals, prompts } = req.body;

    const result = await notion.embedDashboard(id, {
      summary,
      goals,
      ideas,
      planning,
      rituals,
      prompts,
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Embed Dashboard Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
