const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
const Utterance = window.SpeechSynthesisUtterance;
const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
const hasBrowserVoice = Boolean(synth && Utterance);
const supportsLocalVoice = Boolean(AudioContextClass && window.Worker && window.WebAssembly);

const recognitionErrors = {
  'not-allowed': 'Permita o acesso ao microfone no navegador para iniciar a chamada.',
  'service-not-allowed': 'O navegador bloqueou o reconhecimento de voz. Use o teclado ou tente outro navegador.',
  'audio-capture': 'Nenhum microfone foi encontrado.',
  network: 'O serviço de reconhecimento de voz do navegador está indisponível.',
};

const delivery = {
  neutral: { pitch: 1.04, rate: 0.97 },
  happy: { pitch: 1.09, rate: 1.03 },
  curious: { pitch: 1.06, rate: 0.97 },
  surprised: { pitch: 1.1, rate: 1.02 },
  empathetic: { pitch: 1.01, rate: 0.93 },
};

export function makeVoice({ onListen, onTranscript, onSilence, onSpeak, onError, onFallback }) {
  let recognition = null;
  let active = null;
  let audioContext = null;
  let piperWorker = null;
  let nextId = 0;

  function preparePlayback() {
    if (!supportsLocalVoice) return;
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
    playback.stop?.();
    onSpeak(false, playback.button);
  }

  function speakWithBrowser(playback, text, emotion, { pitch, rate }) {
    if (!hasBrowserVoice) {
      finish(playback, 'Não foi possível reproduzir a voz Faber neste navegador.');
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

  function getPiperWorker() {
    if (piperWorker) return piperWorker;
    const worker = new Worker(new URL('./piper.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (active?.id === data.id) active.receive?.(data);
    };
    worker.onerror = () => {
      if (piperWorker !== worker) return;
      worker.terminate();
      piperWorker = null;
      active?.fallback?.();
    };
    return piperWorker = worker;
  }

  function speakWithPiper(playback, text, emotion, preset) {
    let worker;
    let timer;
    let nextStart = 0;
    let started = false;
    let done = false;
    const sources = new Set();

    playback.stop = () => {
      clearTimeout(timer);
      if (worker && worker === piperWorker) worker.postMessage({ id: playback.id });
      for (const source of sources) {
        source.onended = null;
        source.stop();
        source.disconnect();
      }
      sources.clear();
      playback.receive = playback.fallback = null;
    };

    playback.fallback = () => {
      if (active !== playback) return;
      playback.stop();
      if (started || !hasBrowserVoice) {
        finish(playback, 'A voz Faber foi interrompida. Tente ouvir a resposta novamente.');
        return;
      }
      onFallback();
      speakWithBrowser(playback, text, emotion, preset);
    };

    const finishWhenDone = () => {
      if (done && !sources.size) finish(playback);
    };

    playback.receive = ({ samples, sampleRate, error, done: complete }) => {
      clearTimeout(timer);
      if (error || (complete && !started)) {
        playback.fallback();
        return;
      }
      if (complete) {
        done = true;
        finishWhenDone();
        return;
      }
      try {
        if (audioContext?.state !== 'running') throw new Error('Áudio suspenso.');
        const buffer = audioContext.createBuffer(1, samples.length, sampleRate);
        buffer.copyToChannel(samples, 0);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          source.disconnect();
          sources.delete(source);
          finishWhenDone();
        };
        const start = Math.max(nextStart, audioContext.currentTime);
        source.start(start);
        sources.add(source);
        nextStart = start + buffer.duration;
        if (!started) onSpeak(true, playback.button, emotion, 'speaking');
        started = true;
        timer = setTimeout(playback.fallback, 25000);
      } catch {
        playback.fallback();
      }
    };

    onSpeak(true, playback.button, emotion, 'preparing');
    try {
      worker = getPiperWorker();
      timer = setTimeout(playback.fallback, 120000);
      worker.postMessage({ id: playback.id, text });
    } catch {
      playback.fallback();
    }
  }

  function speak(text, button, emotion, { browserOnly = false } = {}) {
    if (!hasBrowserVoice && (browserOnly || !supportsLocalVoice)) return;
    const wasPlaying = active && active.button === button;
    stopSpeaking();
    if (wasPlaying) return;

    const playback = { id: ++nextId, button };
    const preset = delivery[emotion] ?? delivery.neutral;
    active = playback;
    if (!browserOnly && supportsLocalVoice) {
      speakWithPiper(playback, text, emotion, preset);
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
    canSpeak: hasBrowserVoice || supportsLocalVoice,
    supportsLocalVoice,
    preparePlayback,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
