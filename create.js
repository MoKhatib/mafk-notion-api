const { notion, PROJECTS_DB, TASKS_DB, MOODBOARD_TEMPLATE, withRetry } = require('./notion');
const { adoptTemplate } = require('./adopt'); // ✅ NEW: Ritual injection engine

// ✅ Replace with your Notion ID
const DEFAULT_OWNER_ID = 'your-notion-user-id-here';

// ✅ Create a new project and embed mood board + ritual template
async function createProject(name, status = 'Planning', description = '', client = 'Unassigned') {
  const newPage = await withRetry(() =>
    notion.pages.create({
      parent: { database_id: PROJECTS_DB },
      properties: {
        'Project name': { title: [{ text: { content: name } }] },
        Status: { status: { name: status } },
        Description: { rich_text: [{ text: { content: description } }] },
        Client: { select: { name: client || 'Unassigned' } },
        Owner: { people: [{ id: DEFAULT_OWNER_ID }] }
      }
    })
  );

  // ✅ Embed moodboard toggle
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
                  page_id: MOODBOARD_TEMPLATE
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
                        content: 'Drag images into this Mood Board to collect inspiration. You can duplicate it if you’d like a custom version.'
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
    console.error('❌ Failed to embed mood board toggle:', err.message);
  }

  // ✅ Inject the full template (summary, goals, pillars, rituals)
  try {
    await adoptTemplate(newPage.id);
  } catch (err) {
    console.error('❌ Failed to inject default template:', err.message);
  }

  return newPage;
}

// ✅ Create a task under a project
async function createTask(name, projectId, status = 'Not Started', assignee = [], priority = 'Medium', due = null) {
  const taskProps = {
    'Task name': { title: [{ text: { content: name } }] },
    Status: { status: { name: status } },
    Project: { relation: [{ id: projectId }] },
    Priority: { select: { name: priority } }
  };

  if (assignee.length) {
    taskProps.Assignee = {
      people: assignee.map(id => ({ id }))
    };
  }

  if (due) {
    taskProps.Due = { date: { start: due } };
  }

  return await withRetry(() =>
    notion.pages.create({
      parent: { database_id: TASKS_DB },
      properties: taskProps
    })
  );
}

module.exports = {
  createProject,
  createTask
};
