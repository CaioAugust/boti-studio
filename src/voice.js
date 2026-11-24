const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
const Utterance = window.SpeechSynthesisUtterance;

const recognitionErrors = {
  'not-allowed': 'Permita o acesso ao microfone no navegador para iniciar a chamada.',
  'service-not-allowed': 'O navegador bloqueou o reconhecimento de voz. Use o teclado ou tente outro navegador.',
  'audio-capture': 'Nenhum microfone foi encontrado.',
  network: 'O serviço de reconhecimento de voz do navegador está indisponível.',
};

const delivery = {
  neutral: { pitch: 1.32, rate: 1.03 },
  happy: { pitch: 1.48, rate: 1.08 },
  curious: { pitch: 1.38, rate: 1.01 },
  surprised: { pitch: 1.52, rate: 1.08 },
  empathetic: { pitch: 1.18, rate: 0.94 },
};

export function makeVoice({ onListen, onTranscript, onSilence, onSpeak, onError }) {
  let recognition = null;
  let active = null;

  function stopSpeaking() {
    if (!active) return;
    const { button } = active;
    active = null;
    synth.cancel();
    onSpeak(false, button);
  }

  function speak(text, button, emotion) {
    if (!synth || !Utterance) return;
    const wasPlaying = active?.button === button && active;
    stopSpeaking();
    if (wasPlaying) return;

    const utterance = new Utterance(text);
    utterance.lang = 'pt-BR';
    const { pitch, rate } = delivery[emotion] ?? delivery.neutral;
    utterance.pitch = pitch;
    utterance.rate = rate;

    const voices = synth.getVoices();
    const brazilian = voices.filter((voice) => voice.lang.toLowerCase() === 'pt-br');
    utterance.voice = brazilian.find((voice) => voice.localService)
      ?? brazilian[0]
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('pt'))
      ?? null;
    active = { utterance, button };
    function finish(event) {
      if (active?.utterance !== utterance) return;
      active = null;
      if (event.type === 'error') onError('O navegador não conseguiu falar. Confira se há uma voz instalada no dispositivo.');
      onSpeak(false, button);
    }
    utterance.onend = finish;
    utterance.onerror = finish;
    onSpeak(true, button, emotion);
    synth.speak(utterance);
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
    canSpeak: Boolean(synth && Utterance),
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
