import '@fontsource-variable/space-grotesk';
import './style.css';
import { validateAvatar } from 'open-bot-avatar';
import { mountAvatar } from 'open-bot-avatar/dom';
import { setIcon } from './icons.js';
import { askProvider, providers } from './providers.js';
import { makeVoice } from './voice.js';
import connectionAudio from './faber-connection.wav?url';

const byId = (id) => document.getElementById(id);
const avatarHost = byId('avatar');
const avatarIcon = document.querySelector('.brand img').src;
const stateIndicator = byId('avatar-state');
const chat = byId('messages');
const compose = byId('compose');
const input = byId('message');
const send = byId('send');
const callButton = byId('voice-call');
const callStatus = byId('call-status');
const notice = byId('notice');
const clearChat = byId('clear-chat');
const suggestions = byId('suggestions');
const autoSpeak = byId('auto-speak');
const settings = byId('settings');
const settingsDescription = byId('settings-description');
const connectionMessage = settingsDescription.textContent;
const providerInput = byId('provider');
const modelInput = byId('model');
const keyInput = byId('api-key');
const voiceDisclosure = byId('voice-disclosure');
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
  neutral: { label: 'expressão neutra', state: 'idle', mood: 'neutral', lookAt: null, view: { yaw: 0, pitch: 0 } },
  happy: { label: 'expressão alegre', state: 'done', mood: 'happy', lookAt: null, view: { yaw: 0, pitch: 0 } },
  curious: { label: 'expressão curiosa', state: 'thinking', mood: 'neutral', lookAt: { x: 0.7, y: -0.45 }, view: { yaw: 0.15, pitch: 0 } },
  surprised: { label: 'expressão surpresa', state: 'blocked', mood: 'neutral', lookAt: { x: 0, y: -0.35 }, view: { yaw: 0, pitch: -0.15 } },
  empathetic: { label: 'expressão solidária', state: 'waiting', mood: 'neutral', lookAt: { x: -0.15, y: 0.35 }, view: { yaw: -0.06, pitch: 0.1 } },
};
const activities = {
  idle: { label: 'À espera' },
  listening: { label: 'Ouvindo', state: 'waiting' },
  thinking: { label: 'Pensando', state: 'thinking' },
  preparing: { label: 'Preparando a voz Faber' },
  speaking: { label: 'Falando' },
  error: { label: 'Falha na resposta', state: 'blocked' },
};

let emotion = 'neutral';
let spokenEmotion = null;
let readingConnectionMessage = false;
let activity = 'idle';
let connection = null;
let pending = null;
let listening = false;
let callActive = false;
let listenTimer;
let history = [];

function renderAvatar() {
  const current = activities[activity];
  const displayedEmotion = current.state ? 'neutral' : spokenEmotion ?? emotion;
  const { label, ...pose } = expressions[displayedEmotion];
  avatar.update({
    ...pose,
    state: current.state ?? (activity === 'speaking' && displayedEmotion === 'neutral' ? 'working' : pose.state),
    label: 'Boti, avatar 3D, ' + (current.state ? current.label.toLowerCase() : label),
  });
  stateIndicator.dataset.activity = activity;
  stateIndicator.lastElementChild.textContent = current.label;
  callStatus.hidden = !callActive;
  if (callActive) {
    const status = activity === 'idle' ? 'Chamada em andamento' : 'Boti · ' + current.label.toLowerCase();
    if (callStatus.textContent !== status) callStatus.textContent = status;
  }
}

function setNotice(text = '', isError = false) {
  notice.textContent = text;
  notice.hidden = !text;
  notice.dataset.error = String(isError);
}

function syncControls() {
  const hasText = Boolean(input.value.trim());
  send.disabled = !hasText || Boolean(pending) || callActive;
  callButton.disabled = Boolean(pending && !callActive);
  clearChat.disabled = !history.length && !pending;
  suggestions.hidden = history.length > 0 || Boolean(pending) || callActive;
  input.style.height = 'auto';
  input.style.height = Math.min(118, Math.max(40, input.scrollHeight)) + 'px';
}

function updateCallButton() {
  callButton.dataset.active = String(callActive);
  setIcon(callButton.firstElementChild, callActive ? 'hangup' : 'phone');
  callButton.lastElementChild.textContent = callActive ? 'Encerrar chamada' : 'Iniciar chamada';
  for (const button of chat.querySelectorAll('.reply-audio')) button.disabled = callActive;
}

function resumeListening() {
  clearTimeout(listenTimer);
  if (!callActive) return;
  listenTimer = setTimeout(() => {
    if (callActive && !pending && !listening && !spokenEmotion) voice.startListening();
  }, 250);
}

const voice = makeVoice({
  onListen(active) {
    listening = active;
    activity = active ? 'listening' : 'idle';
    renderAvatar();
  },
  onTranscript(text) {
    void submitMessage(text.slice(0, input.maxLength), { fromCall: true });
  },
  onSilence: resumeListening,
  onSpeak(active, button, replyEmotion, phase) {
    spokenEmotion = active ? replyEmotion : null;
    if (button) {
      button.setAttribute('aria-pressed', String(active));
      button.lastElementChild.textContent = active ? 'Parar' : 'Ouvir';
      setIcon(button.firstElementChild, active ? 'stop' : 'volume');
    }
    if (!pending && !listening) activity = active ? phase : 'idle';
    renderAvatar();
    if (!active) resumeListening();
  },
  onError(text) {
    endCall();
    setNotice(text, true);
  },
});

function appendMessage(role, text, replyEmotion = null) {
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
  if (role === 'assistant' && replyEmotion && voice.canSpeak) {
    audioButton = document.createElement('button');
    audioButton.type = 'button';
    audioButton.className = 'button reply-audio';
    audioButton.disabled = callActive;
    audioButton.setAttribute('aria-pressed', 'false');
    audioButton.append(document.createElement('span'), document.createElement('span'));
    setIcon(audioButton.firstElementChild, 'volume');
    audioButton.lastElementChild.textContent = 'Ouvir';
    audioButton.addEventListener('click', () => {
      if (callActive || pending) return;
      setNotice();
      voice.preparePlayback();
      voice.speak(text, audioButton, replyEmotion);
    });
    bubble.append(audioButton);
  }
  chat.scrollTop = chat.scrollHeight;
  return { row, audioButton };
}

function cancelPending() {
  if (!pending) return;
  const { controller, row } = pending;
  pending = null;
  controller.abort();
  row.remove();
}

function endCall() {
  if (!callActive) return;
  callActive = false;
  clearTimeout(listenTimer);
  if (pending?.fromCall) cancelPending();
  voice.stopListening();
  voice.stopSpeaking();
  activity = 'idle';
  updateCallButton();
  renderAvatar();
  syncControls();
}

function resetChat({ keepDraft = false } = {}) {
  endCall();
  cancelPending();
  voice.stopSpeaking();
  history = [];
  emotion = 'neutral';
  activity = 'idle';
  if (!keepDraft) input.value = '';
  chat.replaceChildren();
  appendMessage('assistant', connection
    ? 'Oi, eu sou o Boti! Me mande uma mensagem ou inicie uma chamada para a gente conversar.'
    : 'Oi, eu sou o Boti! Conecte sua chave de API para eu ganhar um cérebro e a gente começar a conversar.');
  setNotice();
  renderAvatar();
  syncControls();
}

async function submitMessage(text, { fromCall = false } = {}) {
  if (!text || pending || listening || fromCall !== callActive) return;
  if (!connection) {
    openSettings();
    return;
  }
  if (!fromCall && autoSpeak.checked) voice.preparePlayback();
  voice.stopSpeaking();
  setNotice();
  const controller = new AbortController();
  const { row } = appendMessage('user', text);
  const request = { controller, fromCall, row };
  pending = request;
  activity = 'thinking';
  if (!fromCall) input.value = '';
  const userMessage = { role: 'user', content: text };
  renderAvatar();
  syncControls();

  try {
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]);
    const reply = await askProvider(connection, [...history.slice(-20), userMessage], signal, { forSpeech: fromCall });
    if (pending !== request) return;
    history.push(userMessage, { role: 'assistant', content: reply.text });
    const { audioButton } = appendMessage('assistant', reply.text, reply.emotion);
    emotion = reply.emotion;
    activity = 'idle';
    pending = null;
    if (fromCall || autoSpeak.checked) {
      voice.speak(reply.text, fromCall ? null : audioButton, reply.emotion);
    }
  } catch (error) {
    if (pending !== request) return;
    pending = null;
    row.remove();
    if (fromCall) endCall();
    else if (!input.value.trim()) input.value = text;
    activity = 'error';
    setNotice(error.message, true);
  } finally {
    renderAvatar();
    syncControls();
  }
}

function updateConnection() {
  const status = byId('provider-status');
  status.textContent = connection ? providers[connection.provider].name : 'Aguardando chave';
  status.classList.toggle('is-connected', Boolean(connection));
  byId('connect-label').textContent = connection ? 'Configurar API' : 'Conectar API';
  autoSpeak.disabled = !voice.canSpeak;
  byId('voice-label').title = autoSpeak.disabled ? 'Leitura em voz alta indisponível neste navegador' : '';
  voiceDisclosure.hidden = !connection || !voice.canSpeak;
  syncControls();
}

function openSettings() {
  endCall();
  byId('settings-title').textContent = connection ? 'Configurar API' : 'Conecte meu cérebro';
  settingsDescription.textContent = connection
    ? 'Escolha o modelo ou troque a chave que uso para conversar.'
    : connectionMessage;
  const provider = connection?.provider ?? 'openai';
  providerInput.value = provider;
  modelInput.value = connection?.model ?? providers[provider].model;
  keyInput.required = !connection;
  keyInput.placeholder = connection ? 'Em branco mantém a chave' : 'Cole sua chave aqui';
  disconnect.hidden = !connection;
  settings.showModal();
}

byId('open-settings').addEventListener('click', openSettings);

providerInput.addEventListener('change', () => {
  const sameProvider = providerInput.value === connection?.provider;
  modelInput.value = sameProvider ? connection.model : providers[providerInput.value].model;
  keyInput.value = '';
  keyInput.required = !sameProvider;
  keyInput.placeholder = sameProvider ? 'Em branco mantém a chave' : 'Cole sua chave aqui';
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
settings.addEventListener('close', () => {
  keyInput.value = '';
  if (readingConnectionMessage) {
    readingConnectionMessage = false;
    voice.stopSpeaking();
  }
});
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
callButton.addEventListener('click', () => {
  if (callActive) {
    endCall();
    return;
  }
  if (!connection) {
    openSettings();
    readingConnectionMessage = true;
    voice.playClip(connectionAudio);
    return;
  }
  if (!voice.canListen || !voice.canSpeak) {
    setNotice('As chamadas precisam de reconhecimento de fala e suporte à voz Faber. Tente no Chrome ou converse por texto.', true);
    return;
  }
  voice.preparePlayback();
  voice.stopSpeaking();
  setNotice();
  callActive = true;
  updateCallButton();
  syncControls();
  voice.startListening();
});
autoSpeak.addEventListener('change', () => {
  if (autoSpeak.checked && connection) voice.preparePlayback();
  if (!autoSpeak.checked && !callActive) voice.stopSpeaking();
});
texture.addEventListener('change', () => avatar.update({ material: texture.value }));

updateConnection();
resetChat();
