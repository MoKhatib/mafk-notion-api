require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const app = express();
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function withRetry(fn, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// CREATE PROJECT
app.post('/projects', async (req, res) => {
  const { name, status, description, client } = req.body;

  if (!name) return res.status(400).json({ error: 'Project name required' });

  try {
    const response = await withRetry(() =>
      notion.pages.create({
        parent: { database_id: process.env.PROJECTS_DB },
        properties: {
          Name: {
            title: [{ text: { content: name } }],
          },
          Status: {
            select: {
              name: status || 'Planning',
            },
          },
          Description: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: description || 'Visual R&D stream for ACB explorations',
                },
              },
            ],
          },
          Client: {
            select: {
              name: client || 'Unassigned',
            },
          },
          Owner: {
            people: [
              {
                object: 'user',
                id: process.env.DEFAULT_OWNER_ID,
              },
            ],
          },
        },
      })
    );

    res.status(200).json({ message: 'Project created', data: response });
  } catch (error) {
    console.error('Notion create project error:', error.body || error);
    res.status(500).json({ error: 'Failed to create project', details: error.body || error });
  }
});

// GET PROJECTS
app.get('/projects', async (req, res) => {
  try {
    const results = await withRetry(() =>
      notion.databases.query({
        database_id: process.env.PROJECTS_DB,
        sorts: [{ property: 'Created', direction: 'descending' }],
      })
    );
    res.json(results.results);
  } catch (err) {
    console.error('Error fetching projects:', err.body || err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MAFK API running on port ${PORT}`);
});
