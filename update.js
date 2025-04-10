const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function updateProject(id, { description, deadline, url, owner, status, client }) {
  const properties = {};

  if (description) {
    properties['Description'] = {
      rich_text: [{
        type: 'text',
        text: { content: description }
      }]
    };
  }

  if (deadline) {
    properties['Deadline'] = {
      date: { start: deadline }
    };
  }

  if (url) {
    properties['URL'] = { url };
  }

  if (owner) {
    properties['Owner'] = {
      people: [{ id: owner }]
    };
  }

  if (status) {
    properties['Status'] = {
      status: { name: status }
    };
  }

  if (client) {
    properties['Client'] = {
      select: { name: client }
    };
  }

  try {
    return await notion.pages.update({
      page_id: id,
      properties
    });
  } catch (error) {
    console.error('❌ Failed to update project:', error.message);
    throw error;
  }
}

module.exports = {
  updateProject
};
