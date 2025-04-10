const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ✅ Database IDs (keep in sync with your Notion)
const PROJECTS_DB = '1cfdbda8f07f8113aa23d21d376676ec';
const TASKS_DB = '1cfdbda8f07f81df844ec6976ba9ad93';
const VISUAL_DB = '1d1dbda8f07f806eaf99ff83c4a87842';
const MOODBOARD_TEMPLATE = '1cfdbda8f07f8027815ce64b448044f6';

// ✅ Global retry helper
async function withRetry(fn, attempts = 2, delay = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

module.exports = {
  notion,
  PROJECTS_DB,
  TASKS_DB,
  VISUAL_DB,
  MOODBOARD_TEMPLATE,
  withRetry
};
