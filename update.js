const { notion } = require('./notion');

/**
 * Update the task status using correct Notion "status" field type
 * @param {string} taskId
 * @param {string} newStatus
 */
async function updateTaskStatus(taskId, newStatus) {
  try {
    await notion.pages.update({
      page_id: taskId,
      properties: {
        Status: { status: { name: newStatus } }, // ✅ Not select — it’s a `status` property
      },
    });
    console.log(`✅ Task ${taskId} status updated to ${newStatus}`);
  } catch (error) {
    console.error('❌ Failed to update status:', error.message);
  }
}

module.exports = { updateTaskStatus };
