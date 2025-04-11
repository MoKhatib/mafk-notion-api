const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.PROJECTS_DB;
const defaultOwnerId = process.env.DEFAULT_OWNER_ID;

// Get all projects
async function getAllProjects() {
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response.results;
}

// Create a new project
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

// Embed dashboard properties into an existing project page
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
