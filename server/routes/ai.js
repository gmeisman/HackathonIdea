import express from 'express';

const router = express.Router();

function buildSystemPrompt(context) {
  return `You are an AI assistant for an ecommerce store manager. Be concise and actionable.

You have access to the complete dataset (allData) and the user's current filtered view (filteredData). Use allData for analysis and comparisons, but be aware of what the user is currently looking at via filteredData and activeFilters so you can answer context-aware questions.

Store data: ${JSON.stringify(context)}`;
}

async function callHuggingFace(prompt, context) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('No HuggingFace API key configured');
  }

  const response = await fetch(
    'https://router.huggingface.co/novita/v3/openai/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [
          { role: 'system', content: buildSystemPrompt(context) },
          { role: 'user', content: prompt },
        ],
        max_tokens: 512,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOllama(prompt, context) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3',
      messages: [
        { role: 'system', content: buildSystemPrompt(context) },
        { role: 'user', content: prompt },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.message.content;
}

router.post('/', async (req, res) => {
  const { prompt, context, screen } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const text = await callHuggingFace(prompt, context || {});
    return res.json({ text, source: 'huggingface' });
  } catch (hfErr) {
    console.warn(`[AI] HuggingFace failed (${hfErr.message}), trying Ollama...`);
    try {
      const text = await callOllama(prompt, context || {});
      return res.json({ text, source: 'ollama' });
    } catch (ollamaErr) {
      console.error(`[AI] Ollama also failed: ${ollamaErr.message}`);
      return res.status(503).json({
        error: 'AI service unavailable. Set HUGGINGFACE_API_KEY in server/.env or start Ollama locally.',
      });
    }
  }
});

export default router;
