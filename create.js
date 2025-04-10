const { notion, PROJECTS_DB, TASKS_DB } = require('./notion');

async function withRetry(fn, attempts = 2, delay = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

async function createProject(name, status = 'Planning', description = '') {
  const newPage = await withRetry(() =>
    notion.pages.create({
      parent: { database_id: PROJECTS_DB },
      properties: {
        'Project name': { title: [{ text: { content: name } }] },
        Status: { status: { name: status } },
        Description: { rich_text: [{ text: { content: description } }] }
      }
    })
  );

  const templatePageId = '1cfdbda8f07f8027815ce64b448044f6'; // Mood Board template

  try {
    await notion.blocks.children.append({
      block_id: newPage.id,
      children: [
        {
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [
              { type: 'text', text: { content: `🖼️ Mood Board: ${name}` } }
            ],
            children: [
              {
                object: 'block',
                type: 'link_to_page',
                link_to_page: {
                  type: 'page_id',
                  page_id: templatePageId
                }
              },
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content:
                          'Start dragging images here to collect visual inspiration for this project. You can duplicate this Mood Board if you’d like a custom version.'
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    });
  } catch (err) {
    console.error('❌ Failed to embed mood board:', err.message);
  }

  return newPage;
}

async function createTask(name, projectId, status = 'Not Started', assignee = [], priority = 'Medium', due = null) {
  return await withRetry(() =>
    notion.pages.create({
      parent: { database_id: TASKS_DB },
      properties: {
        'Task name': { title: [{ text: { content: name } }] },
        Status: { status: { name: status } },
        Project: { relation: [{ id: projectId }] },
        Assignee: { people: assignee.map(id => ({ id })) },
        Priority: { select: { name: priority } },
        Due: due ? { date: { start: due } } : undefined
      }
    })
  );
}

module.exports = { createProject, createTask };
