// Each reaction has a sustained 3D pose and an opening gesture. The provider
// only selects a name. The app owns all colors, motion and rendering.
const rest = 'translate(0, 0) rotate(0deg) scale(1)';

export const neutralPose = {
  state: 'idle',
  mood: 'neutral',
  color: '#a6ce44',
  lookAt: null,
  view: { yaw: 0, pitch: 0 },
};

export const reactions = {
  neutral: {
    label: 'Neutro', cue: 'informação neutra ou emoção incerta',
  },
  happy: {
    label: 'Alegre', cue: 'boa notícia, satisfação ou resposta animada',
    mood: 'happy', color: '#b3d751',
    gesture: [660, ['scale(1.08, .93)', 'translateY(-5%) scale(.96, 1.06)', 'scale(1.025, .975)']],
  },
  laughing: {
    label: 'Gargalhando', cue: 'piada, situação engraçada ou riso genuíno',
    mood: 'happy', color: '#bbda54', view: { yaw: 0.05, pitch: -0.12 },
    gesture: [960, ['rotate(-5deg) scale(1.09, .93)', 'translateY(-4%) scale(.97, 1.075)', 'rotate(4deg) scale(1.08, .94)', 'translateY(-3%) scale(.98, 1.035)', 'scale(1.04, .97)']],
  },
  excited: {
    label: 'Empolgado', cue: 'grande celebração, entusiasmo ou conquista marcante',
    state: 'done', mood: 'happy', color: '#c0df53', lookAt: { x: 0, y: -0.3 },
    gesture: [920, ['scale(1.10, .88)', 'translateY(-9%) rotate(-6deg) scale(.96, 1.10)', 'rotate(4deg) scale(1.08, .93)', 'translateY(-4%) scale(.98, 1.05)']],
  },
  proud: {
    label: 'Orgulhoso', cue: 'reconhecimento de esforço ou orgulho de uma conquista',
    state: 'done', mood: 'happy', color: '#accf46', view: { yaw: -0.1, pitch: -0.17 },
    gesture: [790, ['translateY(-4%) scale(1.07, 1.035)', 'rotate(5deg) scale(1.05)', 'scale(1.02)']],
  },
  relieved: {
    label: 'Aliviado', cue: 'alívio após um susto ou problema resolvido',
    mood: 'happy', color: '#accb53', view: { yaw: 0, pitch: 0.12 },
    gesture: [1000, ['translateY(-3%) scale(.98, 1.055)', 'translateY(3%) scale(1.105, .915)', 'scale(1.035, .975)']],
  },
  grateful: {
    label: 'Agradecido', cue: 'agradecimento ou reconhecimento de um gesto gentil',
    mood: 'happy', color: '#adca50', lookAt: { x: 0, y: 0.18 },
    gesture: [830, ['translateY(5%) scale(1.05, .94)', 'translateY(-1%) scale(.995, 1.015)', 'translateY(2%) scale(1.015, .98)']],
  },
  affectionate: {
    label: 'Carinhoso', cue: 'carinho, acolhimento caloroso ou uma saudação afetuosa',
    mood: 'happy', color: '#b5cf55', view: { yaw: 0.12, pitch: 0.06 },
    gesture: [920, ['translateX(4%) rotate(9deg) scale(1.025)', 'translateX(2%) rotate(4deg) scale(1.04)', 'rotate(2deg)']],
  },
  touched: {
    label: 'Comovido', cue: 'algo tocante, emocionante ou sentimental',
    state: 'waiting', mood: 'happy', color: '#a8c65a', lookAt: { x: 0.1, y: 0.3 },
    gesture: [1050, ['translateY(4%) rotate(-3deg) scale(.925, .92)', 'scale(.965, 1.025)', 'translateY(1%) scale(.985)']],
  },
  shy: {
    label: 'Tímido', cue: 'elogio recebido, timidez ou constrangimento leve',
    mood: 'happy', color: '#a6c857', lookAt: { x: -0.9, y: 0.55 }, view: { yaw: -0.30, pitch: 0.13 },
    gesture: [850, ['translate(-6%, 2%) rotate(-10deg) scale(.92)', 'translate(-3%, 1%) rotate(-6deg) scale(.96)', 'rotate(-2deg)']],
  },
  playful: {
    label: 'Brincalhão', cue: 'provocação leve, brincadeira ou humor travesso',
    state: 'working', mood: 'happy', color: '#b6d853', lookAt: { x: 0.82, y: -0.22 },
    gesture: [940, ['translateX(6%) rotate(10deg)', 'translate(-5%, -3%) rotate(-10deg) scale(.98, 1.06)', 'translateX(3%) rotate(5deg)']],
  },
  curious: {
    label: 'Curioso', cue: 'curiosidade, uma pergunta ou vontade de descobrir mais',
    state: 'thinking', lookAt: { x: 0.72, y: -0.45 }, view: { yaw: 0.16, pitch: -0.04 },
    gesture: [780, ['translate(4%, -1%) rotate(12deg) scale(1.025)', 'rotate(8deg)', 'rotate(4deg)']],
  },
  surprised: {
    label: 'Surpreso', cue: 'revelação inesperada, especialmente quando a valência é neutra',
    state: 'blocked', color: '#b3d145', lookAt: { x: 0, y: -0.35 }, view: { yaw: 0, pitch: -0.15 },
    gesture: [620, ['translateY(-5%) scale(.94, 1.145)', 'scale(1.055, .96)', 'scale(.985, 1.02)']],
  },
  amazed: {
    label: 'Impressionado', cue: 'admiração, espanto positivo ou algo extraordinário',
    mood: 'happy', color: '#c1d953', lookAt: { x: 0, y: -0.8 }, view: { yaw: 0, pitch: -0.25 },
    gesture: [990, ['translateY(-4%) scale(1.09)', 'translateY(-7%) scale(1.05, 1.10)', 'translateY(-2%) scale(1.035)']],
  },
  startled: {
    label: 'Assustado', cue: 'susto, sobressalto ou medo repentino',
    state: 'blocked', color: '#a6bc57', lookAt: { x: 0.88, y: -0.38 }, view: { yaw: 0.18, pitch: -0.23 },
    gesture: [690, ['translate(-7%, -5%) rotate(-12deg) scale(.90, 1.10)', 'translateX(-3%) rotate(4deg) scale(.97)', 'rotate(-3deg)']],
  },
  confused: {
    label: 'Confuso', cue: 'informação contraditória, ambiguidade ou dificuldade de entender',
    state: 'thinking', color: '#a3c549', lookAt: { x: -0.65, y: -0.25 }, view: { yaw: -0.19, pitch: 0.06 },
    gesture: [1020, ['rotate(-11deg) scale(.96, 1.025)', 'rotate(11deg) scale(1.03, .985)', 'rotate(-6deg)']],
  },
  skeptical: {
    label: 'Desconfiado', cue: 'ceticismo, suspeita ou afirmação que merece dúvida',
    state: 'waiting', color: '#9db949', lookAt: { x: 0.92, y: 0.12 }, view: { yaw: -0.31, pitch: -0.08 },
    gesture: [840, ['translate(-4%, 0) rotate(-8deg) scale(.96, 1.025)', 'translateX(-2%) rotate(-6deg)', 'rotate(-3deg)']],
  },
  thoughtful: {
    label: 'Pensativo', cue: 'reflexão, ponderação ou avaliação de alternativas',
    state: 'thinking', lookAt: { x: -0.55, y: -0.8 }, view: { yaw: -0.14, pitch: -0.16 },
    gesture: [970, ['translateY(-3%) rotate(-5deg) scale(.98, 1.04)', 'rotate(-3deg)', 'translateY(-1%)']],
  },
  focused: {
    label: 'Concentrado', cue: 'atenção concentrada em uma tarefa, explicação ou detalhes',
    state: 'working', color: '#a1c246', lookAt: { x: 0, y: 0.12 }, view: { yaw: 0, pitch: 0.14 },
    gesture: [590, ['translateY(2%) scale(1.045, .98)', 'scale(1.075, 1.025)', 'scale(1.02)']],
  },
  determined: {
    label: 'Determinado', cue: 'decisão firme, compromisso ou incentivo para agir',
    color: '#acc241', lookAt: { x: 0, y: 0 }, view: { yaw: 0, pitch: 0.19 },
    gesture: [740, ['translateY(-3%) scale(.96, 1.08)', 'translateY(4%) scale(1.12, .89)', 'scale(1.045, 1.035)']],
  },
  worried: {
    label: 'Preocupado', cue: 'risco, incerteza preocupante ou apreensão por alguém',
    state: 'waiting', color: '#9eb550', lookAt: { x: 0.35, y: 0.53 }, view: { yaw: 0.10, pitch: 0.18 },
    gesture: [1000, ['translateY(3%) rotate(4deg) scale(.91)', 'rotate(2deg) scale(.947)', 'scale(.976)']],
  },
  nervous: {
    label: 'Nervoso', cue: 'ansiedade, tensão ou nervosismo antecipatório',
    color: '#a8bd58', lookAt: { x: -0.48, y: 0.22 }, view: { yaw: -0.12, pitch: 0.06 },
    gesture: [690, ['translateX(-3%) rotate(-4deg) scale(.96)', 'translateX(3%) rotate(4deg) scale(.96)', 'translateX(-2%) rotate(-3deg) scale(.975)', 'translateX(2%)']],
  },
  empathetic: {
    label: 'Solidário', cue: 'escutar e acolher uma dificuldade de outra pessoa',
    state: 'waiting', color: '#a7c85b', lookAt: { x: -0.15, y: 0.28 }, view: { yaw: -0.08, pitch: 0.17 },
    gesture: [1030, ['translate(2%, 3%) rotate(6deg) scale(1.035, .96)', 'translateY(1%) rotate(3deg)', 'scale(1.015, .99)']],
  },
  sad: {
    label: 'Triste', cue: 'tristeza própria, perda ou uma notícia genuinamente triste',
    state: 'waiting', color: '#8fad53', lookAt: { x: 0, y: 0.9 }, view: { yaw: 0, pitch: 0.28 },
    gesture: [1130, ['translateY(6%) scale(.95, .88)', 'translateY(4%) scale(.97, .92)', 'translateY(2%) scale(.99, .965)']],
  },
  disappointed: {
    label: 'Decepcionado', cue: 'expectativa frustrada ou resultado aquém do esperado',
    state: 'waiting', color: '#a0b84d', lookAt: { x: -0.65, y: 0.7 }, view: { yaw: -0.19, pitch: 0.18 },
    gesture: [880, ['translateY(-1%) scale(.985, 1.01)', 'translate(-3%, 6%) rotate(-6deg) scale(1.05, .90)', 'translateY(2%) rotate(-3deg)']],
  },
  annoyed: {
    label: 'Irritado', cue: 'irritação ou frustração com uma situação, sem hostilidade à pessoa',
    state: 'waiting', color: '#acb73c', lookAt: { x: -0.72, y: 0 }, view: { yaw: -0.2, pitch: 0.06 },
    gesture: [680, ['translateX(-4%) rotate(-6deg) scale(1.07, .95)', 'translateX(3%) rotate(5deg)', 'rotate(-2deg) scale(1.035, .98)']],
  },
  bored: {
    label: 'Entediado', cue: 'monotonia, tédio ou uma repetição sem graça',
    state: 'waiting', color: '#99b24e', lookAt: { x: 0.96, y: 0.35 }, view: { yaw: 0.28, pitch: 0.09 },
    gesture: [1100, ['translate(5%, 3%) rotate(10deg) scale(1.035, .935)', 'translate(3%, 2%) rotate(6deg)', 'rotate(3deg)']],
  },
  sleepy: {
    label: 'Sonolento', cue: 'sono, bocejo ou cansaço tranquilo',
    state: 'waiting', color: '#92ad61', lookAt: { x: 0.12, y: 0.7 }, view: { yaw: 0.04, pitch: 0.24 },
    gesture: [1350, ['translateY(4%) rotate(4deg) scale(1.06, .92)', 'translateY(1%) scale(.98, 1.04)', 'translateY(5%) rotate(6deg) scale(1.04, .90)', 'translateY(2%) rotate(3deg)']],
  },
};

export const reactionChoices = Object.entries(reactions)
  .map(([id, { cue }]) => `[${id}] ${cue}`)
  .join('\n');

export function playReaction(host, id) {
  const reaction = reactions[id];
  if (!reaction.gesture || window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return null;
  const [duration, transforms] = reaction.gesture;
  return host.animate(
    [rest, ...transforms, rest].map((transform) => ({ transform, easing: 'cubic-bezier(.22,.72,.35,1)' })),
    { duration },
  );
}
