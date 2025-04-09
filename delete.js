const { notion } = require('./notion');

async function deletePage(pageId) {
  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
    console.log(`✅ Page ${pageId} archived (soft-deleted).`);
  } catch (error) {
    console.error(`❌ Error deleting page ${pageId}:`, error.message);
  }
}

module.exports = { deletePage };
