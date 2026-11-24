import createPhonemizer from '@diffusionstudio/piper-wasm/build/piper_phonemize.js';
import phonemizerData from '@diffusionstudio/piper-wasm/build/piper_phonemize.data?url';
import phonemizerWasm from '@diffusionstudio/piper-wasm/build/piper_phonemize.wasm?url';
import { env, InferenceSession, Tensor } from 'onnxruntime-web/wasm';
import runtimeWasm from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import faber from './faber.json';

const modelUrl = 'https://huggingface.co/rhasspy/piper-voices/resolve/375a0fe641dea077c2a47b4e9a056d6da521eed3/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx';
const modelIntegrity = 'sha256-hYVV46BkIJxXCI/mvXDEw9xU0D6qAMRdXsr0OjP5Wqc=';
const { sample_rate: sampleRate } = faber.audio;
const ids = faber.phoneme_id_map;
const scales = new Float32Array([1.3, faber.inference.length_scale, faber.inference.noise_w]);

env.wasm.numThreads = 1;
env.wasm.wasmPaths = { wasm: runtimeWasm };

let engine;
let activeId;
let queue = Promise.resolve();
let phonemes = [];

async function loadVoice() {
  const [response, phonemizer] = await Promise.all([
    fetch(modelUrl, {
      integrity: modelIntegrity,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }),
    createPhonemizer({
      noExitRuntime: true,
      locateFile: (file) => file.endsWith('.data') ? phonemizerData : phonemizerWasm,
      print: (line) => { phonemes.push(JSON.parse(line).phonemes); },
    }),
  ]);
  if (!response.ok) throw new Error('Não foi possível baixar a voz Faber.');
  const session = await InferenceSession.create(await response.arrayBuffer(), {
    executionProviders: ['wasm'],
  });
  return { phonemizer, session };
}

function getEngine() {
  engine ??= loadVoice().catch((error) => {
    engine = null;
    throw error;
  });
  return engine;
}

function toInput(phonemeList) {
  const input = [...ids['^'], ...ids._];
  for (const phoneme of phonemeList) {
    if (ids[phoneme]) input.push(...ids[phoneme], ...ids._);
  }
  input.push(...ids.$);
  return BigInt64Array.from(input, (id) => BigInt(id));
}

async function speak(id, text) {
  const { phonemizer, session } = await getEngine();
  for (const sentence of text.trim().split(/(?<=[.!?…])\s+/u)) {
    if (activeId !== id) return;
    // Piper processes sentences independently, as in the Co Host.
    phonemes = [];
    phonemizer.callMain([
      '-l', faber.espeak.voice,
      '--input', JSON.stringify([{ text: sentence }]),
      '--espeak_data', '/espeak-ng-data',
    ]);
    for (const phonemeList of phonemes) {
      if (!phonemeList?.length) continue;
      const input = toInput(phonemeList);
      const { output } = await session.run({
        input: new Tensor('int64', input, [1, input.length]),
        input_lengths: new Tensor('int64', BigInt64Array.of(BigInt(input.length)), [1]),
        scales: new Tensor('float32', scales, [3]),
      });
      if (activeId !== id) return;

      // Match the normalization applied by the Piper CLI.
      const samples = new Float32Array(output.data);
      let peak = 0;
      for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
      if (peak) {
        for (let index = 0; index < samples.length; index++) samples[index] /= peak;
      }
      self.postMessage({ id, samples, sampleRate }, [samples.buffer]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  if (activeId === id) self.postMessage({ id, done: true });
}

self.onmessage = ({ data: { id, text } }) => {
  activeId = text ? id : undefined;
  if (!text) return;
  queue = queue.then(async () => {
    if (activeId === id) await speak(id, text);
  }).catch((error) => {
    if (activeId === id) self.postMessage({ id, error: error.message });
  });
};
