const { Client } = require('@notionhq/client');
const { withRetry } = require('./utils'); // ✅ for retry logic
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.PROJECTS_DB;
const defaultOwnerId = process.env.DEFAULT_OWNER_ID;

// ✅ Get all projects (FIXED: uses created_time sort)
async function getAllProjects() {
  const response = await withRetry(() =>
    notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          timestamp: 'created_time', // ✅ FIX: replaces invalid 'Created' property
          direction: 'descending',
        },
      ],
    })
  );

  return response.results.map(page => ({
    id: page.id,
    name:
      page.properties['Project name']?.title?.[0]?.plain_text ||
      page.properties.Name?.title?.[0]?.plain_text ||
      'Untitled',
    status: page.properties.Status?.status?.name || 'Unknown',
  }));
}

// ✅ Create a new project
async function createProject({ name, status, description, client }) {
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      'Project name': {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      'Status': {
        status: {
          name: status,
        },
      },
      'Description': {
        rich_text: [
          {
            text: {
              content: description,
            },
          },
        ],
      },
      'Client': {
        multi_select: [
          {
            name: client,
          },
        ],
      },
      'Owner': {
        people: [
          {
            id: defaultOwnerId,
          },
        ],
      },
    },
  });

  return response;
}

// ✅ Embed dashboard into a project
async function embedDashboard(projectId, { summary, goals, ideas, planning, rituals, prompts }) {
  const response = await notion.pages.update({
    page_id: projectId,
    properties: {
      'Summary': {
        rich_text: [{ text: { content: summary } }],
      },
      'Goals': {
        rich_text: [{ text: { content: goals } }],
      },
      'Ideas': {
        rich_text: [{ text: { content: ideas } }],
      },
      'Planning': {
        rich_text: [{ text: { content: planning } }],
      },
      'Rituals': {
        rich_text: [{ text: { content: rituals } }],
      },
      'Prompts': {
        rich_text: [{ text: { content: prompts } }],
      },
    },
  });

  return response;
}

module.exports = {
  getAllProjects,
  createProject,
  embedDashboard,
};
