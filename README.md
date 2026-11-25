# ApexCore Chat

Aplicação de chat desenvolvida para um laboratório de integração com a API oficial da OpenAI. A interface tem identidade visual própria, com sugestões de mensagens e histórico salvo no navegador.

## Como funciona

O frontend em **React e Vite** envia a mensagem e até 18 mensagens anteriores para `POST /api/chat`. O backend em **Node.js e Express** valida a entrada, chama a **Responses API** pelo SDK oficial da OpenAI e devolve o texto ao navegador.

A chave fica em `.env`, lido pelo servidor. O histórico desta versão é armazenado em `localStorage`, no navegador e endereço em uso. O botão **Nova conversa** apaga esse histórico após confirmação. A aplicação dispensa banco de dados, conta de usuário e template de design externo.

## Executar localmente

Requisitos incluem Node.js **22.12+** e uma chave de API com acesso ao modelo configurado.

```bash
git clone https://github.com/VinnyFigTerminal/apexcore-chat.git
cd apexcore-chat
npm ci
```

Copie `.env.example` para `.env` e preencha `OPENAI_API_KEY`. No PowerShell use `Copy-Item .env.example .env`. Em Bash use `cp .env.example .env`. O modelo padrão é `gpt-4.1-mini` e pode ser trocado com `OPENAI_MODEL`.

Para servir interface e API em um único processo:

```bash
npm run build
npm start
```

Abra [http://127.0.0.1:3001](http://127.0.0.1:3001), envie uma mensagem e depois uma pergunta que dependa do contexto anterior. Recarregue a página para conferir o histórico local.

Para editar a interface com recarregamento automático, deixe `npm run api` rodando na porta padrão 3001 em um terminal e execute `npm run dev` em outro. Abra o endereço mostrado pelo Vite.

## Arquivos principais

| Arquivo | Finalidade |
|---|---|
| `src/main.jsx` e `src/style.css` | Interface, conversa, histórico local e estados de espera e erro |
| `server.js` | Endpoint de chat, integração com a OpenAI e serviço dos arquivos compilados |
| `vite.config.js` | Proxy de desenvolvimento para a API |
| `.env.example` | Modelo de configuração sem credenciais |
| `package-lock.json` | Versões das dependências para instalar com `npm ci` |

## Verificação

O build foi compilado e servido pelo Express. A rota foi exercitada com o SDK real e transporte simulado para verificar o envio de contexto, o retorno de texto, a validação e os erros de limite e chave ausente. A execução com a OpenAI depende de uma chave válida.

## Referências

- [Repositório de referência do laboratório](https://github.com/felipeAguiarCode/node-react-chatgpt-clone)
- [Guia oficial da OpenAI](https://developers.openai.com/api/docs/quickstart)
- [Referência da Responses API](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create)
- [Chaves de API](https://platform.openai.com/api-keys)
