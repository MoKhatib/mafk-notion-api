const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');

// Create a new project
async function createProject(name, status = 'Planning', description = '') {
  const newPage = await notion.pages.create({
    parent: { database_id: PROJECTS_DB },
    properties: {
      'Project name': {
        title: [{ text: { content: name } }]
      },
      Status: {
        status: { name: status }
      },
      Description: {
        rich_text: [{ text: { content: description } }]
      }
    }
  });

  return newPage;
}

// Create a new task and embed GPT suggestion block
async function createTask(name, projectId, status = 'Not Started', assignee = [], priority = 'Medium', due = null) {
  const newPage = await notion.pages.create({
    parent: { database_id: TASKS_DB },
    properties: {
      'Task name': {
        title: [{ text: { content: name } }]
      },
      Status: {
        status: { name: status }
      },
      Project: {
        relation: [{ id: projectId }]
      },
      Assignee: {
        people: assignee.map(id => ({ id }))
      },
      Priority: {
        select: { name: priority }
      },
      Due: due ? { date: { start: due } } : undefined
    }
  });

  // Create GPT suggestions block
  const prompts = [
    `Write a creative brief for: ${name}`,
    `Suggest visual styles or tone guidelines for: ${name}`,
    `Generate concept prompts using AI tools for: ${name}`
  ];

  const gptToggle = {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: '🧠 GPT Suggestions' } }],
      children: prompts.map(p => ({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: `• ${p}` } }]
        }
      }))
    }
  };

  await notion.blocks.children.append({
    block_id: newPage.id,
    children: [gptToggle]
  });

  return newPage;
}

module.exports = { createTask, createProject };
