// adopt.js
const { withRetry, notion } = require('./notion');

async function adoptTemplate(projectId) {
  const blocks = [
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '📄 Project Summary' } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: 'New project created via MAFK ritual system.' } }]
          }
        }]
      }
    },
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🎯 Goals & Objectives' } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: '' } }]
          }
        }]
      }
    },
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🧠 Creative Pillars' } }],
        children: ['Narrative Arc', 'Visual Treatment', 'Framing Strategy', 'Emotive Tone'].map(pillar => ({
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ type: 'text', text: { content: `📌 ${pillar}` } }],
            children: [{
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ type: 'text', text: { content: '' } }]
              }
            }]
          }
        }))
      }
    },
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '📝 Creative Brief' } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: '' } }]
          }
        }]
      }
    },
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🧪 Sprint Rituals' } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: 'Use /sprint or /generate-sprint-from-goal' } }]
          }
        }]
      }
    }
  ];

  await withRetry(() => notion.blocks.children.append({
    block_id: projectId,
    children: blocks
  }));
}

module.exports = { adoptTemplate };
