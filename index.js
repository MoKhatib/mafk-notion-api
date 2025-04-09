const { fetchProjects, fetchTasks } = require('./fetch');
const { createProject, createTask } = require('./create');
const { updateTaskStatus, updateProject } = require('./update');
const { deletePage } = require('./delete');
const { notion } = require('./notion');

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

  // ✅ Unarchive and update the real MAFK project
  const mafkId = '1d0dbda8-f07f-81d7-9764-c7612dffd2b8';

  console.log('🗃️ Unarchiving MAFK project...');
  await notion.pages.update({
    page_id: mafkId,
    archived: false,
  });
  console.log(`✅ Project ${mafkId} unarchived.`);

  console.log('🔧 Updating MAFK project metadata...');
  await updateProject(mafkId);
})();
