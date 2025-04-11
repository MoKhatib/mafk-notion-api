require('dotenv').config();
const { Client } = require('@notionhq/client');

// ✅ Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ✅ Pull config from environment
const PROJECTS_DB = process.env.PROJECTS_DB;
const TASKS_DB = process.env.TASKS_DB;
const VISUAL_DB = process.env.VISUAL_DB;
const MOODBOARD_TEMPLATE = process.env.MOODBOARD_TEMPLATE;
const DEFAULT_OWNER_ID = process.env.DEFAULT_OWNER_ID;

// 🔁 Global retry wrapper for all Notion calls
async function withRetry(fn, attempts = 2, delay = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.warn(`Retry attempt ${i + 1} failed: ${error.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// ✅ Export Notion + constants
module.exports = {
  notion,
  withRetry,
  PROJECTS_DB,
  TASKS_DB,
  VISUAL_DB,
  MOODBOARD_TEMPLATE,
  DEFAULT_OWNER_ID
};
