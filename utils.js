require('dotenv').config();
const fetch = require('node-fetch');

// 🔁 Retry Wrapper
async function withRetry(fn, attempts = 2, delay = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.warn(`Retrying after error: ${error.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// 🧠 GPT Caption Generator
async function generateImageCaption({ imageUrl, pageTitle = '' }) {
  const prompt = `
You are an AI creative assistant trained in visual language and storytelling.

Image URL: ${imageUrl}
Context: ${pageTitle}

Describe this image in 1–2 poetic or strategic lines. Focus on mood, design tone, or concept. Limit to 25 words.
`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.7
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No caption generated.';
}

// ✍️ GPT Creative Brief Generator
async function generateTaskBrief(taskTitle) {
  const prompt = `
You are an AI creative director. Write a clear, concise creative brief (2–3 sentences max) for the following task:

"${taskTitle}"

The brief should guide the visual exploration, tone, or creative constraint behind the task.
`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.75
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No brief generated.';
}

module.exports = {
  withRetry,
  generateImageCaption,
  generateTaskBrief
};
