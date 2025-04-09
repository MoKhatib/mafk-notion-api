// notion.js
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

module.exports = {
  notion,
  PROJECTS_DB: process.env.PROJECTS_DB,
  TASKS_DB: process.env.TASKS_DB,
};
