const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');

// Handles missing title safely
function safeGetTitle(page, prop = 'Project name') {
  const titleProp = page.properties?.[prop]?.title;
  return Array.isArray(titleProp) && titleProp.length > 0
    ? titleProp[0].plain_text
    : 'Untitled';
}

async function fetchProjects() {
  const response = await notion.databases.query({ database_id: PROJECTS_DB });

  return response.results.map(page => ({
    id: page.id,
    name: safeGetTitle(page, 'Project name'),  // ✅ updated
    status: page.properties?.Status?.status?.name || 'Unknown',  // ✅ updated
  }));
}

async function fetchTasks() {
  const response = await notion.databases.query({ database_id: TASKS_DB });

  return response.results.map(page => ({
    id: page.id,
    name: safeGetTitle(page, 'Task name'),  // ⛔️ You may need to inspect your Tasks DB next
    status: page.properties?.Status?.status?.name || 'Unknown',
  }));
}

module.exports = { fetchProjects, fetchTasks };
