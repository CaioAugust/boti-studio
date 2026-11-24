const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
const supportsLocalVoice = Boolean(AudioContextClass && window.Worker && window.WebAssembly);

const recognitionErrors = {
  'not-allowed': 'Permita o acesso ao microfone no navegador para iniciar a chamada.',
  'service-not-allowed': 'O navegador bloqueou o reconhecimento de voz. Use o teclado ou tente outro navegador.',
  'audio-capture': 'Nenhum microfone foi encontrado.',
  network: 'O serviço de reconhecimento de voz do navegador está indisponível.',
};

export function makeVoice({ onListen, onTranscript, onSilence, onSpeak, onError }) {
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
      if (!piperWorker) getPiperWorker().postMessage({ warmup: true });
    } catch {
      // Playback reports initialization errors when a reply is ready to speak.
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

  function playClip(url) {
    stopSpeaking();
    const clip = new Audio(url);
    const playback = { stop: () => clip.pause() };
    active = playback;
    clip.onplaying = () => {
      if (active === playback) onSpeak(true, null, 'neutral', 'speaking');
    };
    clip.onended = () => finish(playback);
    clip.play().catch(() => finish(playback));
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
      active?.fail?.('A voz Faber ficou indisponível. Recarregue a página e tente novamente.');
    };
    return piperWorker = worker;
  }

  function speakWithPiper(playback, text, emotion) {
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
      playback.receive = playback.fail = null;
    };

    playback.fail = (message) => {
      if (active !== playback) return;
      playback.stop();
      finish(playback, message);
    };

    const finishWhenDone = () => {
      if (done && !sources.size) finish(playback);
    };

    playback.receive = ({ samples, sampleRate, error, done: complete }) => {
      clearTimeout(timer);
      if (error || (complete && !started)) {
        playback.fail('Não foi possível gerar a voz Faber. Tente ouvir a resposta novamente.');
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
        timer = setTimeout(() => playback.fail('A voz Faber foi interrompida. Tente ouvir a resposta novamente.'), 25000);
      } catch {
        playback.fail('O navegador não conseguiu reproduzir a voz Faber. Tente ouvir a resposta novamente.');
      }
    };

    onSpeak(true, playback.button, emotion, 'preparing');
    try {
      worker = getPiperWorker();
      timer = setTimeout(() => playback.fail('A voz Faber demorou a carregar. Tente ouvir a resposta novamente.'), 120000);
      worker.postMessage({ id: playback.id, text });
    } catch {
      playback.fail('Não foi possível iniciar a voz Faber neste navegador.');
    }
  }

  function speak(text, button, emotion) {
    if (!supportsLocalVoice) return;
    const wasPlaying = active && active.button === button;
    stopSpeaking();
    if (wasPlaying) return;

    const playback = { id: ++nextId, button };
    active = playback;
    speakWithPiper(playback, text, emotion);
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
    canSpeak: supportsLocalVoice,
    playClip,
    preparePlayback,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
