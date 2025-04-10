const { notion, TASKS_DB, PROJECTS_DB } = require('./notion');

// ✅ Retry helper (can also be moved to utils.js if used elsewhere)
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

// ✅ Update project metadata
async function updateProject(projectId, updates) {
  const properties = {};

  if (updates.description) {
    properties.Description = {
      rich_text: [{ text: { content: updates.description } }]
    };
  }

  if (updates.status) {
    properties.Status = { status: { name: updates.status } };
  }

  if (updates.deadline) {
    properties.Deadline = { date: { start: updates.deadline } };
  }

  if (updates.url) {
    properties.URL = { url: updates.url };
  }

  if (updates.owner) {
    properties.Owner = { people: [{ id: updates.owner }] };
  }

  if (updates.client) {
    properties.Client = { select: { name: updates.client } };
  }

  return await withRetry(() =>
    notion.pages.update({
      page_id: projectId,
      properties
    })
  );
}

// ✅ Update full task metadata
async function updateTask(taskId, updates) {
  const properties = {};

  if (updates.name) {
    properties['Task name'] = {
      title: [{ text: { content: updates.name } }]
    };
  }

  if (updates.status) {
    properties.Status = { status: { name: updates.status } };
  }

  if (updates.priority) {
    properties.Priority = { select: { name: updates.priority } };
  }

  if (updates.due) {
    properties.Due = { date: { start: updates.due } };
  }

  if (updates.assignee) {
    properties.Assignee = {
      people: updates.assignee.map((id) => ({ id }))
    };
  }

  return await withRetry(() =>
    notion.pages.update({
      page_id: taskId,
      properties
    })
  );
}

// ✅ Update task status only
async function updateTaskStatus(taskId, status) {
  return await withRetry(() =>
    notion.pages.update({
      page_id: taskId,
      properties: {
        Status: { status: { name: status } }
      }
    })
  );
}

module.exports = {
  updateProject,
  updateTask,
  updateTaskStatus
};
