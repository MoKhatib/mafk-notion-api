const { fetchProjects, fetchTasks } = require('./fetch');
const { createProject, createTask } = require('./create');
const { updateTaskStatus } = require('./update');
const { deletePage } = require('./delete');

(async () => {
  console.log('📁 Fetching projects...');
  const projects = await fetchProjects();
  console.log(projects);

  console.log('🆕 Creating new project...');
  const newProject = await createProject('New GPT Project', 'In Progress');
  console.log(newProject);

  console.log('✅ Creating a task under new project...');
  const newTask = await createTask('Setup API integration', newProject.id);
  console.log(newTask);

  console.log('✏️ Updating task status...');
  await updateTaskStatus(newTask.id, 'In Progress');

  console.log('🗑️ Deleting (archiving) task...');
  await deletePage(newTask.id);
})();
