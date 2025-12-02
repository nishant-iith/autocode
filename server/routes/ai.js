import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a message to the AI
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *               - model
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *               model:
 *                 type: string
 *               max_tokens:
 *                 type: integer
 *               temperature:
 *                 type: number
 *               stream:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: AI response (streamed or JSON)
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, model, max_tokens, temperature, stream } = req.body;
    // Get key from request header (user provided) or env (server provided)
    const apiKey = req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: 'OpenRouter API key is missing. Please provide it in settings or configure the server.' });
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5001', // Server origin
        'X-Title': 'AutoCode Server',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: max_tokens || 2000,
        temperature: temperature || 0.7,
        stream: stream || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.error?.message || `Upstream API error: ${response.statusText}`,
      });
    }

    if (stream) {
      // Pipe the streaming response directly to the client
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.body.pipe(res);
    } else {
      // Return JSON response
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ error: 'Internal server error processing AI request' });
  }
});

export default router;
