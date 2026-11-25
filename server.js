import express from 'express';
import OpenAI from 'openai';
import { fileURLToPath } from 'node:url';

export function createApp({
  client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000, maxRetries: 0 })
    : null,
  model = process.env.OPENAI_MODEL || 'gpt-4.1-mini',
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '160kb' }));

  app.post('/api/chat', async (req, res) => {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
        messages.some((item, index) => item?.role !== (index % 2 ? 'assistant' : 'user') ||
          typeof item.content !== 'string' || !item.content.trim() || item.content.length > 4000) ||
        messages.at(-1).role !== 'user') {
      return res.status(400).json({ error: 'Envie uma conversa válida, com até 20 mensagens de até 4.000 caracteres.' });
    }
    if (!client) return res.status(503).json({ error: 'Configure OPENAI_API_KEY no arquivo .env do servidor.' });
    try {
      const response = await client.responses.create({
        model,
        input: messages.map(({ role, content }) => ({ role, content })),
        instructions: 'Responda com clareza. Use o idioma da mensagem do usuário.',
        max_output_tokens: 1000,
        store: false,
      });
      const reply = response.output_text?.trim();
      if (!reply) return res.status(502).json({ error: 'Nenhuma resposta em texto foi retornada.' });
      return res.json({ reply });
    } catch (error) {
      if (error.status === 429) return res.status(429).json({ error: 'Limite ou cota da API atingido. Confira os limites da conta.' });
      if (error.status === 401 || error.status === 403) {
        return res.status(502).json({ error: 'A API recusou o acesso. Confira a chave e as permissões do projeto OpenAI.' });
      }
      return res.status(502).json({ error: 'A API está indisponível. Tente novamente.' });
    }
  });

  app.use(express.static(fileURLToPath(new URL('./dist', import.meta.url))));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'Requisição grande demais.' : 'Não foi possível processar a requisição.' });
  });
  return app;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 3001);
  createApp().listen(port, '127.0.0.1', () => console.log(`ApexCore Chat em http://127.0.0.1:${port}`));
}
