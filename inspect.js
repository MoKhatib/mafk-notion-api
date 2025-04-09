const { notion, PROJECTS_DB } = require('./notion');

(async () => {
  const db = await notion.databases.retrieve({ database_id: PROJECTS_DB });
  console.log('📋 Project Properties:');
  console.log(Object.keys(db.properties));
})();
