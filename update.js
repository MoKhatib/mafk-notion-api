const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function updateProject(id, { deadline, url, owner, description }) {
  const properties = {};

  if (deadline) {
    properties['Deadline'] = {
      date: {
        start: deadline
      }
    };
  }

  if (url) {
    properties['URL'] = {
      url: url
    };
  }

  if (owner) {
    properties['Owner'] = {
      people: [{ id: owner }]
    };
  }

  if (description) {
    properties['Description'] = {
      rich_text: [
        {
          type: 'text',
          text: {
            content: description
          }
        }
      ]
    };
  }

  return await notion.pages.update({
    page_id: id,
    properties
  });
}

module.exports = {
  updateProject
};
