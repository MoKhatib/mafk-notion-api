const { notion, PROJECTS_DB } = require('./notion');

(async () => {
  const db = await notion.databases.retrieve({ database_id: PROJECTS_DB });
  console.log('📋 Properties in your Projects DB:');
  console.log(Object.keys(db.properties));
})();
