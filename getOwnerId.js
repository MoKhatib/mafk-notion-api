const { notion } = require('./notion');

async function getProjectsWithOwner() {
  const databaseId = '1cfdbda8f07f8113aa23d21d376676ec';

  const response = await notion.databases.query({
    database_id: databaseId,
    page_size: 10
  });

  response.results.forEach(project => {
    const title = project.properties['Project name']?.title?.[0]?.plain_text || '(Untitled)';
    const ownerId = project.properties.Owner?.people?.[0]?.id || 'No owner assigned';
    console.log(`📌 Project: ${title}`);
    console.log(`👤 Owner ID: ${ownerId}`);
    console.log('---------------------------');
  });
}

getProjectsWithOwner().catch(console.error);
