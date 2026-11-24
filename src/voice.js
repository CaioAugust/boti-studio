import { generateSpeech } from './providers.js';

const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
const Utterance = window.SpeechSynthesisUtterance;
const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
const hasBrowserVoice = Boolean(synth && Utterance);

const recognitionErrors = {
  'not-allowed': 'Permita o acesso ao microfone no navegador para iniciar a chamada.',
  'service-not-allowed': 'O navegador bloqueou o reconhecimento de voz. Use o teclado ou tente outro navegador.',
  'audio-capture': 'Nenhum microfone foi encontrado.',
  network: 'O serviço de reconhecimento de voz do navegador está indisponível.',
};

const delivery = {
  neutral: { pitch: 1.04, rate: 0.97, style: 'Use uma voz próxima, calorosa e tranquila, com um sorriso discreto.' },
  happy: { pitch: 1.09, rate: 1.03, style: 'Deixe transparecer alegria espontânea, com energia leve e variação de melodia.' },
  curious: { pitch: 1.06, rate: 0.97, style: 'Fale com curiosidade genuína, fazendo breves pausas para destacar as descobertas.' },
  surprised: { pitch: 1.1, rate: 1.02, style: 'Deixe a surpresa aparecer no começo, depois volte ao ritmo natural.' },
  empathetic: { pitch: 1.01, rate: 0.93, style: 'Use um tom acolhedor e suave, com pausas que deixem a pessoa respirar.' },
};

export function makeVoice({ onListen, onTranscript, onSilence, onSpeak, onError, onFallback }) {
  let recognition = null;
  let active = null;
  let audioContext = null;

  function canSpeak(key) {
    return hasBrowserVoice || Boolean(key && AudioContextClass);
  }

  function preparePlayback(key) {
    if (!key || !AudioContextClass) return;
    try {
      audioContext ??= new AudioContextClass();
      if (audioContext.state !== 'running') void audioContext.resume().catch(() => {});
    } catch {
      // The browser synthesizer can still speak if Web Audio is unavailable.
    }
  }

  function finish(playback, error) {
    if (active !== playback) return;
    active = null;
    if (error) onError(error);
    onSpeak(false, playback.button);
  }

  function stopSpeaking() {
    if (!active) return;
    const playback = active;
    active = null;
    playback.controller.abort();
    playback.stop?.();
    onSpeak(false, playback.button);
  }

  function speakWithBrowser(playback, text, emotion, { pitch, rate }) {
    if (!hasBrowserVoice) {
      finish(playback, 'Não foi possível reproduzir a voz. Confira o acesso à API de áudio da OpenAI.');
      return;
    }

    const utterance = new Utterance(text);
    utterance.lang = 'pt-BR';
    utterance.pitch = pitch;
    utterance.rate = rate;

    const voices = synth.getVoices();
    const brazilian = voices.filter((voice) => voice.lang.toLowerCase() === 'pt-br');
    utterance.voice = brazilian.find((voice) => /natural|neural|premium|enhanced|aprimorad/i.test(voice.name))
      ?? brazilian.find((voice) => voice.default)
      ?? brazilian[0]
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('pt'))
      ?? null;

    playback.stop = () => synth.cancel();
    utterance.onend = () => finish(playback);
    utterance.onerror = () => finish(playback, 'O navegador não conseguiu falar. Confira se há uma voz instalada no dispositivo.');
    onSpeak(true, playback.button, emotion, 'speaking');
    synth.speak(utterance);
  }

  async function speakWithOpenAI(playback, text, emotion, preset, key) {
    onSpeak(true, playback.button, emotion, 'preparing');
    try {
      const signal = AbortSignal.any([playback.controller.signal, AbortSignal.timeout(20000)]);
      if (!audioContext) throw new Error('Web Audio indisponível.');
      if (audioContext.state !== 'running') {
        await Promise.race([
          audioContext.resume(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Áudio suspenso.')), 1500)),
        ]);
      }
      if (active !== playback) return;

      const bytes = await generateSpeech(text, preset.style, key, signal);
      if (active !== playback) return;
      const buffer = await audioContext.decodeAudioData(bytes);
      if (active !== playback) return;
      if (audioContext.state !== 'running') throw new Error('Reprodução de áudio suspensa.');

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        source.disconnect();
        finish(playback);
      };
      source.start();
      playback.stop = () => source.stop();
      onSpeak(true, playback.button, emotion, 'speaking');
    } catch {
      if (active !== playback) return;
      if (hasBrowserVoice) onFallback();
      speakWithBrowser(playback, text, emotion, preset);
    }
  }

  function speak(text, button, emotion, key) {
    if (!canSpeak(key)) return;
    const wasPlaying = active && active.button === button;
    stopSpeaking();
    if (wasPlaying) return;

    const playback = { button, controller: new AbortController() };
    const preset = delivery[emotion] ?? delivery.neutral;
    active = playback;
    if (key && AudioContextClass) {
      void speakWithOpenAI(playback, text, emotion, preset, key);
    } else {
      speakWithBrowser(playback, text, emotion, preset);
    }
  }

  function stopListening() {
    const current = recognition;
    if (!current) return;
    recognition = null;
    current.abort();
    onListen(false);
  }

  function startListening() {
    if (recognition || !Recognition) return;

    const current = new Recognition();
    current.lang = 'pt-BR';
    current.continuous = false;
    current.interimResults = false;
    recognition = current;
    let transcript = '';
    let failed = false;

    current.onresult = ({ results }) => {
      if (recognition === current) transcript = results[0][0].transcript.trim();
    };
    current.onerror = ({ error }) => {
      if (recognition !== current || error === 'no-speech') return;
      failed = true;
      onError(recognitionErrors[error] ?? 'Não foi possível reconhecer a fala. Tente iniciar outra chamada.');
    };
    current.onend = () => {
      if (recognition !== current) return;
      recognition = null;
      onListen(false);
      if (failed) return;
      if (transcript) onTranscript(transcript);
      else onSilence();
    };
    try {
      current.start();
      onListen(true);
    } catch {
      recognition = null;
      onError('O microfone não pôde ser ativado. Verifique as permissões do navegador.');
    }
  }

  return {
    canListen: Boolean(Recognition),
    canSpeak,
    supportsGeneratedVoice: Boolean(AudioContextClass),
    preparePlayback,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
