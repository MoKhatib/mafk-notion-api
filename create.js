const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');

/**
 * Create a new project in Notion
 * - Title property is 'Project name'
 * - Status is of type 'status'
 */
async function createProject(name, status = 'Planning') {
  try {
    const response = await notion.pages.create({
      parent: { database_id: PROJECTS_DB },
      properties: {
        'Project name': { title: [{ text: { content: name } }] },  // ✅ exact title field
        Status: { status: { name: status } },                      // ✅ using "status" type correctly
      },
    });
    console.log(`✅ Created project: ${name}`);
    return response;
  } catch (error) {
    console.error('❌ Failed to create project:', error.message);
    throw error;
  }
}

/**
 * Create a new task in Notion, linked to a project
 * - Title property is 'Task name'
 * - Status is of type 'status'
 * - Project is a relation field
 */
async function createTask(name, projectId, status = 'Not Started') {
  try {
    const response = await notion.pages.create({
      parent: { database_id: TASKS_DB },
      properties: {
        'Task name': { title: [{ text: { content: name } }] },     // ✅ exact title field
        Status: { status: { name: status } },                      // ✅ using "status" type correctly
        Project: {
          relation: [{ id: projectId }],
        },
      },
    });
    console.log(`✅ Created task: ${name}`);
    return response;
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
    throw error;
  }
}

module.exports = { createProject, createTask };
