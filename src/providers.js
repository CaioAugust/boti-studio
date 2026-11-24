export const providers = {
  openai: { name: 'OpenAI', model: 'gpt-4o-mini', url: 'https://api.openai.com/v1/chat/completions' },
  anthropic: { name: 'Claude', model: 'claude-haiku-4-5-20251001', url: 'https://api.anthropic.com/v1/messages' },
};

const instruction = `Você é Boti, um assistente amigável. Responda com clareza no idioma da
pessoa. Prefira português do Brasil quando não houver indicação. Comece sua
resposta com uma linha própria contendo apenas uma destas expressões:
[neutral], [happy], [curious], [surprised] ou [empathetic].
Na linha seguinte escreva a resposta em texto simples, pronta para leitura em voz alta.
Escolha a expressão que melhor comunica como você reage à mensagem mais recente da
pessoa, considerando o contexto da conversa. Mantenha o tom da resposta coerente com
essa reação. Use [neutral] quando não tiver certeza.`;

export function parseReply(value) {
  const text = value?.trim() ?? '';
  const expression = text.match(/^\[(neutral|happy|curious|surprised|empathetic)\][ \t]*\r?\n/i);
  const reply = expression ? text.slice(expression[0].length).trim() : text;
  if (!reply) throw new Error('O provedor devolveu uma resposta vazia. Tente enviar a mensagem novamente.');
  return { text: reply, emotion: expression?.[1].toLowerCase() ?? 'neutral' };
}

function providerError(status) {
  switch (status) {
    case 400:
    case 404: return 'O provedor recusou o pedido. Confira se o modelo informado está disponível para a sua chave.';
    case 401:
    case 403: return 'O provedor recusou o acesso. Confira a chave e as permissões para uso pelo navegador.';
    case 402: return 'Confira os créditos disponíveis na conta do provedor.';
    case 429: return 'O provedor atingiu um limite de uso. Confira os créditos ou tente de novo em alguns instantes.';
    default: return 'O provedor está indisponível. Tente novamente em alguns instantes.';
  }
}

export async function askProvider(connection, messages, signal) {
  const { provider, model, key } = connection;
  const openai = provider === 'openai';
  const headers = openai
    ? { Authorization: 'Bearer ' + key }
    : { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
  const body = openai
    ? { model, max_completion_tokens: 1200, store: false, messages: [{ role: 'system', content: instruction }, ...messages] }
    : { model, max_tokens: 1200, system: instruction, messages };

  let response;
  try {
    response = await fetch(providers[provider].url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (error.name === 'TimeoutError') throw new Error('O provedor demorou a responder. Tente novamente.');
    throw new Error('A conexão falhou. Confira a internet e se sua conta permite chamadas pelo navegador.');
  }
  if (!response.ok) throw new Error(providerError(response.status));

  const data = await response.json().catch(() => null);
  const text = openai
    ? data?.choices?.[0]?.message?.content
    : data?.content?.filter((block) => block.type === 'text').map((block) => block.text).join('\n');
  return parseReply(text);
}
