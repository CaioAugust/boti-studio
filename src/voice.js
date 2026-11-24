const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
const Utterance = window.SpeechSynthesisUtterance;

const recognitionErrors = {
  'not-allowed': 'Permita o acesso ao microfone no navegador para ditar.',
  'service-not-allowed': 'O navegador bloqueou o reconhecimento de voz. Use o teclado ou tente outro navegador.',
  'audio-capture': 'Nenhum microfone foi encontrado.',
  'no-speech': 'O microfone não detectou fala. Tente novamente.',
  network: 'O serviço de reconhecimento de voz do navegador está indisponível.',
};

export function makeVoice({ onListen, onTranscript, onSpeak, onError }) {
  let recognition = null;
  let active = null;

  function stopSpeaking() {
    if (!active) return;
    const { button } = active;
    active = null;
    synth.cancel();
    onSpeak(false, button);
  }

  function speak(text, button) {
    if (!synth || !Utterance) return;
    const wasPlaying = active?.button === button && active;
    stopSpeaking();
    if (wasPlaying) return;

    const utterance = new Utterance(text);
    utterance.lang = 'pt-BR';
    const voices = synth.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === 'pt-br')
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('pt'))
      ?? null;
    active = { utterance, button };
    function finish(event) {
      if (active?.utterance !== utterance) return;
      active = null;
      onSpeak(false, button);
      if (event.type === 'error') onError('O navegador não conseguiu ler esta resposta em voz alta.');
    }
    utterance.onend = finish;
    utterance.onerror = finish;
    onSpeak(true, button);
    synth.speak(utterance);
  }

  function stopListening() {
    const current = recognition;
    if (!current) return;
    recognition = null;
    current.abort();
    onListen(false);
  }

  function toggleListening() {
    if (recognition) {
      recognition.stop();
      return;
    }
    if (!Recognition) return;
    stopSpeaking();

    const current = new Recognition();
    current.lang = 'pt-BR';
    current.continuous = false;
    current.interimResults = false;
    recognition = current;
    current.onresult = ({ results }) => {
      if (recognition === current) onTranscript(results[0][0].transcript);
    };
    current.onerror = ({ error }) => {
      if (recognition !== current || error === 'aborted') return;
      onError(recognitionErrors[error] ?? 'Não foi possível reconhecer a fala. Tente novamente.');
    };
    current.onend = () => {
      if (recognition !== current) return;
      recognition = null;
      onListen(false);
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
    toggleListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
