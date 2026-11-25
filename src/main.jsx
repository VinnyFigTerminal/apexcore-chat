import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const storageKey = 'apexcore.chat.v1';
const suggestions = [
  'Explique como funciona o DNS com um exemplo.',
  'Monte um plano de estudos de redes para uma semana.',
  'Revise um e-mail profissional comigo.',
];
function loadMessages() {
  try {
    const history = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(history) && history.length % 2 === 0 &&
      history.every((item, i) => item?.role === (i % 2 ? 'assistant' : 'user') &&
        typeof item.content === 'string') ? history : [];
  } catch {
    return [];
  }
}
function App() {
  const [messages, setMessages] = useState(loadMessages);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const busy = useRef(false);
  const bottom = useRef(null);
  const input = useRef(null);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch {}
  }, [messages]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages, pending, error]);

  async function send(raw) {
    const content = raw.trim();
    if (!content || content.length > 4000 || busy.current) return;
    busy.current = true;
    setError('');
    setPending(content);
    setDraft('');
    const newMessage = { role: 'user', content };
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages.slice(-18).map(item => ({
          ...item, content: item.content.slice(0, 4000),
        })), newMessage] }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== 'string') {
        throw new Error(data.error || 'Resposta inesperada do servidor.');
      }
      setMessages([...messages, newMessage, { role: 'assistant', content: data.reply }]);
    } catch (cause) {
      setError(cause instanceof SyntaxError ? 'O servidor não respondeu como esperado.' : cause.message);
      setDraft(content);
    } finally {
      busy.current = false;
      setPending('');
      requestAnimationFrame(() => input.current?.focus());
    }
  }

  return <main className="shell">
    <header>
      <a className="brand" href="/" aria-label="ApexCore Chat"><span aria-hidden="true">A</span>ApexCore Chat</a>
      <button type="button" className="quiet" disabled={!!pending || !messages.length}
        onClick={() => {
          if (!window.confirm('Apagar a conversa salva neste navegador?')) return;
          setMessages([]); setDraft(''); setError(''); input.current?.focus();
        }}>Nova conversa</button>
    </header>
    <section className="conversation" aria-label="Conversa">
      {!messages.length && !pending && <div className="welcome">
        <h1>Em que posso ajudar?</h1>
        <div className="suggestions">{suggestions.map(text =>
          <button key={text} type="button" onClick={() => send(text)}>{text}<span aria-hidden="true">↗</span></button>)}</div>
      </div>}
      {messages.map(({role,content},i) => <article className={role} key={i}>
        <strong>{role === 'user' ? 'Você' : 'ApexCore'}</strong><p>{content}</p>
      </article>)}
      {pending && <><article className="user"><strong>Você</strong><p>{pending}</p></article>
        <p role="status" className="status">ApexCore está respondendo…</p></>}
      {error && <p role="alert" className="error">{error}</p>}
      <div ref={bottom}/>
    </section>
    <form onSubmit={e => { e.preventDefault(); send(draft); }}>
      <label htmlFor="message">Sua mensagem</label>
      <div className="composer"><textarea ref={input} id="message" rows="2" value={draft}
        disabled={!!pending} maxLength={4000} placeholder="Escreva aqui"
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault(); send(draft);
          }
        }}/><button className="send" disabled={!!pending || !draft.trim()}>Enviar</button></div>
      <p className="hint">Enter para enviar · Shift + Enter para quebrar linha</p>
    </form>
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);
