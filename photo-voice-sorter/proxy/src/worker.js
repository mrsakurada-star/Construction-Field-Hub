// photo-voice-sorter/proxy/src/worker.js
import { buildClassifyPrompt } from './prompt.js';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/classify') {
      return new Response('Not found', { status: 404, headers: cors });
    }

    try {
      const { spokenText, processMaster } = await request.json();
      const prompt = buildClassifyPrompt({ spokenText, processMaster });

      const gRes = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!gRes.ok) {
        return new Response(JSON.stringify({ error: 'gemini_error', status: gRes.status }), {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const data = await gRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text);

      return new Response(
        JSON.stringify({ title: parsed.title || '', process: parsed.process || '' }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: 'proxy_error', message: String(e) }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
