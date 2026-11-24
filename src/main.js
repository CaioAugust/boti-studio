import '@fontsource-variable/space-grotesk';
import './style.css';
import { validateAvatar } from 'open-bot-avatar';
import { mountAvatar } from 'open-bot-avatar/dom';
import { setIcon } from './icons.js';
import { askProvider, demoReply, providers } from './providers.js';
import { makeVoice } from './voice.js';

const byId = (id) => document.getElementById(id);
const avatarHost = byId('avatar');
const avatarIcon = document.querySelector('.brand img').src;
const stateIndicator = byId('avatar-state');
const emotionButtons = [...document.querySelectorAll('[data-emotion]')];
const chat = byId('messages');
const compose = byId('compose');
const input = byId('message');
const send = byId('send');
const mic = byId('mic');
const notice = byId('notice');
const clearChat = byId('clear-chat');
const suggestions = byId('suggestions');
const autoSpeak = byId('auto-speak');
const settings = byId('settings');
const providerInput = byId('provider');
const modelInput = byId('model');
const keyInput = byId('api-key');
const disconnect = byId('disconnect');
const texture = byId('texture');

for (const icon of document.querySelectorAll('[data-icon]')) setIcon(icon, icon.dataset.icon);

const definition = validateAvatar({
  version: 1,
  id: 'boti',
  name: 'Boti',
  body: {
    path: 'M50 18 C59 18 63 10 75 14 C88 18 93 32 93 48 C93 73 77 88 50 88 C23 88 7 73 7 48 C7 32 12 18 25 14 C37 10 41 18 50 18 Z',
  },
  eyes: { x: 50, y: 47, spacing: 15, scale: 1.15 },
});
if (!definition.ok) throw new Error('Definição inválida do avatar: ' + definition.errors.join(', '));

const avatar = mountAvatar(avatarHost, {
  definition: definition.value,
  color: '#a6ce44',
  eyeColor: '#1e2916',
  material: texture.value,
  depth: 11,
  followPointer: true,
  label: 'Boti, avatar 3D',
});

const expressions = {
  neutral: { state: 'idle', mood: 'neutral', lookAt: null, view: { yaw: 0, pitch: 0 } },
  happy: { state: 'done', mood: 'happy', lookAt: null, view: { yaw: 0, pitch: 0 } },
  curious: { state: 'thinking', mood: 'neutral', lookAt: { x: 0.7, y: -0.45 }, view: { yaw: 0.15, pitch: 0 } },
  surprised: { state: 'blocked', mood: 'neutral', lookAt: { x: 0, y: -0.35 }, view: { yaw: 0, pitch: -0.15 } },
  empathetic: { state: 'waiting', mood: 'neutral', lookAt: { x: -0.15, y: 0.35 }, view: { yaw: -0.06, pitch: 0.1 } },
};
const activities = {
  idle: { label: 'À espera' },
  listening: { label: 'Ouvindo', state: 'waiting' },
  thinking: { label: 'Pensando', state: 'thinking' },
  speaking: { label: 'Falando', state: 'working' },
  error: { label: 'Falha na resposta', state: 'blocked' },
};

let emotion = 'neutral';
let activity = 'idle';
let connection = null;
let pending = null;
let listening = false;
let history = [];

function renderAvatar() {
  const current = activities[activity];
  avatar.update({ ...expressions[emotion], ...(current.state ? { state: current.state } : {}) });
  stateIndicator.dataset.activity = activity;
  stateIndicator.lastElementChild.textContent = current.label;
  for (const button of emotionButtons) button.setAttribute('aria-pressed', String(button.dataset.emotion === emotion));
}

function setNotice(text = '', isError = false) {
  notice.textContent = text;
  notice.hidden = !text;
  notice.dataset.error = String(isError);
}

function syncControls() {
  const hasText = Boolean(input.value.trim());
  send.disabled = !hasText || Boolean(pending) || listening;
  mic.disabled = !voice.canListen || Boolean(pending);
  clearChat.disabled = !history.length && !pending;
  suggestions.hidden = history.length > 0 || Boolean(pending);
  input.style.height = 'auto';
  input.style.height = Math.min(118, Math.max(40, input.scrollHeight)) + 'px';
}

function setMicLabel(listening) {
  const label = listening ? 'Parar de ditar' : 'Ditar mensagem';
  mic.title = label;
  mic.setAttribute('aria-label', label);
  mic.setAttribute('aria-pressed', String(listening));
  setIcon(mic.firstElementChild, listening ? 'stop' : 'mic');
}

const voice = makeVoice({
  onListen(active) {
    listening = active;
    setMicLabel(active);
    activity = active ? 'listening' : 'idle';
    renderAvatar();
    syncControls();
    if (active) setNotice('Fale agora. Revise o texto antes de enviar.');
    else if (notice.dataset.error !== 'true') setNotice();
  },
  onTranscript(text) {
    const prefix = input.value.trimEnd();
    input.value = (prefix ? prefix + ' ' + text : text).slice(0, input.maxLength);
    input.focus();
    syncControls();
  },
  onSpeak(active, button) {
    if (button) {
      button.setAttribute('aria-pressed', String(active));
      button.lastElementChild.textContent = active ? 'Parar' : 'Ouvir';
      setIcon(button.firstElementChild, active ? 'stop' : 'volume');
    }
    if (!pending && !listening) activity = active ? 'speaking' : 'idle';
    renderAvatar();
  },
  onError: (text) => setNotice(text, true),
});

if (!voice.canListen) mic.title = 'Ditado indisponível neste navegador';
if (!voice.canSpeak) {
  autoSpeak.disabled = true;
  byId('voice-label').title = 'Leitura em voz alta indisponível neste navegador';
}

function appendMessage(role, text, allowAudio = true) {
  const row = document.createElement('div');
  row.className = 'message-row ' + role;
  if (role === 'assistant') {
    const icon = document.createElement('img');
    icon.className = 'message-avatar';
    icon.alt = '';
    icon.src = avatarIcon;
    row.append(icon);
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const name = document.createElement('span');
  name.className = 'speaker';
  name.textContent = role === 'assistant' ? 'Boti' : 'Você';
  const message = document.createElement('p');
  message.className = 'message-text';
  message.textContent = text;
  bubble.append(name, message);
  row.append(bubble);
  chat.append(row);

  let audioButton;
  if (role === 'assistant' && allowAudio && voice.canSpeak) {
    audioButton = document.createElement('button');
    audioButton.type = 'button';
    audioButton.className = 'button reply-audio';
    audioButton.setAttribute('aria-pressed', 'false');
    audioButton.append(document.createElement('span'), document.createElement('span'));
    setIcon(audioButton.firstElementChild, 'volume');
    audioButton.lastElementChild.textContent = 'Ouvir';
    audioButton.addEventListener('click', () => {
      if (listening || pending) return;
      voice.speak(text, audioButton);
    });
    bubble.append(audioButton);
  }
  chat.scrollTop = chat.scrollHeight;
  return { row, audioButton };
}

function resetChat({ keepDraft = false } = {}) {
  pending?.abort();
  pending = null;
  voice.stopListening();
  voice.stopSpeaking();
  history = [];
  emotion = 'neutral';
  activity = 'idle';
  if (!keepDraft) input.value = '';
  chat.replaceChildren();
  appendMessage('assistant', connection
    ? 'Oi, eu sou Boti. Pode escrever ou usar o microfone para me contar o que está pensando.'
    : 'Oi, eu sou Boti. Experimente uma sugestão ou escreva uma mensagem. Para conversar com a IA, conecte sua chave de API.', false);
  setNotice();
  renderAvatar();
  syncControls();
}

async function submitMessage(text) {
  if (!text || pending || listening) return;
  voice.stopSpeaking();
  setNotice();
  const request = new AbortController();
  pending = request;
  activity = 'thinking';
  input.value = '';
  const { row } = appendMessage('user', text);
  const userMessage = { role: 'user', content: text };
  renderAvatar();
  syncControls();

  try {
    const reply = connection
      ? await askProvider(connection, [...history.slice(-20), userMessage], AbortSignal.any([request.signal, AbortSignal.timeout(45000)]))
      : demoReply(text);
    if (pending !== request) return;
    history.push(userMessage, { role: 'assistant', content: reply.text });
    const { audioButton } = appendMessage('assistant', reply.text);
    emotion = reply.emotion;
    activity = 'idle';
    pending = null;
    if (autoSpeak.checked) voice.speak(reply.text, audioButton);
  } catch (error) {
    if (pending !== request) return;
    pending = null;
    row.remove();
    if (!input.value.trim()) input.value = text;
    activity = 'error';
    setNotice(error.message, true);
  } finally {
    renderAvatar();
    syncControls();
  }
}

function updateConnection() {
  const status = byId('provider-status');
  status.textContent = connection ? providers[connection.provider].name : 'Modo demo';
  status.classList.toggle('is-connected', Boolean(connection));
  byId('connect-label').textContent = connection ? 'Configurar API' : 'Conectar API';
}

byId('open-settings').addEventListener('click', () => {
  const provider = connection?.provider ?? 'openai';
  providerInput.value = provider;
  modelInput.value = connection?.model ?? providers[provider].model;
  keyInput.required = !connection;
  keyInput.placeholder = connection ? 'Deixe em branco para manter a chave' : 'Cole sua chave aqui';
  disconnect.hidden = !connection;
  settings.showModal();
});

providerInput.addEventListener('change', () => {
  const sameProvider = providerInput.value === connection?.provider;
  modelInput.value = sameProvider ? connection.model : providers[providerInput.value].model;
  keyInput.value = '';
  keyInput.required = !sameProvider;
  keyInput.placeholder = sameProvider ? 'Deixe em branco para manter a chave' : 'Cole sua chave aqui';
});

byId('settings-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const provider = providerInput.value;
  const model = modelInput.value.trim();
  const sameProvider = provider === connection?.provider;
  const key = keyInput.value.trim() || (sameProvider ? connection.key : '');
  if (!model || !key) {
    (model ? keyInput : modelInput).focus();
    return;
  }
  const connectionChanged = !sameProvider || key !== connection.key;
  connection = { provider, model, key };
  updateConnection();
  if (connectionChanged || pending) resetChat({ keepDraft: true });
  else {
    setNotice();
    activity = 'idle';
    renderAvatar();
  }
  settings.close();
});

disconnect.addEventListener('click', () => {
  connection = null;
  updateConnection();
  resetChat({ keepDraft: true });
  settings.close();
});

byId('close-settings').addEventListener('click', () => settings.close());
settings.addEventListener('close', () => { keyInput.value = ''; });
settings.addEventListener('cancel', () => { keyInput.value = ''; });
window.addEventListener('pagehide', () => {
  connection = null;
  keyInput.value = '';
  updateConnection();
  resetChat();
});

input.addEventListener('input', syncControls);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!send.disabled) compose.requestSubmit();
  }
});
compose.addEventListener('submit', (event) => {
  event.preventDefault();
  void submitMessage(input.value.trim());
});
for (const button of suggestions.querySelectorAll('[data-prompt]')) {
  button.addEventListener('click', () => {
    input.value = button.dataset.prompt;
    input.focus();
    syncControls();
  });
}
clearChat.addEventListener('click', () => { resetChat(); input.focus(); });
mic.addEventListener('click', voice.toggleListening);
autoSpeak.addEventListener('change', () => { if (!autoSpeak.checked) voice.stopSpeaking(); });
texture.addEventListener('change', () => avatar.update({ material: texture.value }));
for (const button of emotionButtons) {
  button.addEventListener('click', () => {
    emotion = button.dataset.emotion;
    renderAvatar();
  });
}

resetChat();
