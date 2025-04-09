const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');

/**
 * Create a project with updated Notion schema
 */
async function createProject(name, status = 'Planning', description = '') {
  return await notion.pages.create({
    parent: { database_id: PROJECTS_DB },
    properties: {
      'Project name': { title: [{ text: { content: name } }] },
      Status: { status: { name: status } },
      Description: { rich_text: [{ text: { content: description } }] }
    }
  });
}

/**
 * Create a task with updated Notion schema
 */
async function createTask(name, projectId, status = 'Not Started', assignee = [], priority = 'Medium', due = null) {
  return await notion.pages.create({
    parent: { database_id: TASKS_DB },
    properties: {
      'Task name': { title: [{ text: { content: name } }] },
      Status: { status: { name: status } },
      Project: { relation: [{ id: projectId }] },
      Assignee: { people: assignee.map(id => ({ id })) },
      Priority: { select: { name: priority } },
      Due: due ? { date: { start: due } } : undefined
    }
  });
}

module.exports = { createProject, createTask };
