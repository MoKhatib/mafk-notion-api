const { notion, PROJECTS_DB } = require('./notion');

async function updateProject(projectId) {
  await notion.pages.update({
    page_id: projectId,
    properties: {
      Deadline: {
        date: {
          start: '2025-04-30'
        }
      },
      Owner: {
        people: [
          {
            object: 'user',
            id: '07f00e3e-b9a2-452a-bc7b-c423a1466724' // This is YOUR user ID
          }
        ]
      },
      URL: {
        url: 'https://chatgpt.com/g/g-67f2d97457f8819186d101c36d94aa92-mafk'
      },
      Summary: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: `MAFK is your custom AI assistant designed to support Mohammed Khatib in building creative AI leadership. From helping shape strategy to enhancing brand storytelling and streamlining execution in Notion-native environments, MAFK brings technical fluency, emotional intelligence, and design intuition into every touchpoint.`
            }
          }
        ]
      }
    }
  });

  console.log('✅ Project updated in Notion');
}

module.exports = { updateProject };
