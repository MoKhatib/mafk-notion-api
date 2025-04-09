const { notion, TASKS_DB } = require('./notion');

(async () => {
  const db = await notion.databases.retrieve({ database_id: TASKS_DB });
  console.log('📋 Task Properties:');
  console.log(Object.keys(db.properties));
})();
