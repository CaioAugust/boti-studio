# Boti Studio

Converse por texto e voz com um avatar 3D. [Abra a demonstração no GitHub Pages](https://caioaugust.github.io/boti-studio/).

## Como usar

- **API.** Escolha OpenAI ou Anthropic (Claude), informe sua chave e ajuste o identificador do modelo, se necessário. A chave é necessária para conversar por texto ou voz. A expressão do avatar acompanha o conteúdo da conversa.
- **Chamada.** Clique em **Iniciar chamada**, permita o acesso ao microfone e fale normalmente. O Boti responde em voz alta e volta a escutar. Clique em **Encerrar chamada** para desligar. No chat por texto, use **Ouvir** ou marque **Ler respostas em voz alta**.
- **Voz Faber.** A mesma voz em português brasileiro do Co Host roda no próprio navegador pelo Piper e ONNX Runtime. O modelo é carregado no primeiro uso de voz. Funciona com a chave de chat que você já usa, tanto na OpenAI quanto no Claude.
- **Avatar.** O avatar reage automaticamente e mantém a expressão da resposta durante a leitura em voz alta. Você pode alternar entre pelúcia e superfície lisa. O renderizador usa WebGL2 para a pelúcia e exibe a superfície lisa em dispositivos sem suporte.

## Rodar localmente

Requer Node.js 22.12 ou mais recente.

```sh
npm ci
npm run dev
```

Para conferir a versão que vai para o GitHub Pages, rode `npm run build` e `npm run preview`. O GitHub Pages serve a raiz da branch `gh-pages`. Para atualizar o site, publique nela o conteúdo de `dist` e mantenha o arquivo `.nojekyll` e o modelo em `voice/faber-858555e3.onnx`. Para incluir o modelo na compilação, salve-o em `public/voice/faber-858555e3.onnx`. Ele pode ser obtido no [repositório original fixado](https://huggingface.co/rhasspy/piper-voices/resolve/375a0fe641dea077c2a47b4e9a056d6da521eed3/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx).

## Chaves, dados e compatibilidade

O protótipo é estático e não usa banco de dados. A chave e o histórico ficam na memória da aba e são descartados ao recarregar ou fechar a página. O navegador envia a chave e o contexto recente da conversa diretamente à API escolhida. As chamadas estão sujeitas a cobrança, limites e permissões do provedor. Use uma chave dedicada a testes com as menores permissões possíveis. Para produção, proteja as chaves em um backend, conforme as [orientações da OpenAI](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety).

A chamada usa a Web Speech API em português do Brasil. O navegador reconhece a fala e envia o texto reconhecido para a mesma conversa usada pelo chat. Só o texto vai para a API de IA. O Piper gera o áudio localmente. O modelo Faber tem cerca de 63 MB e é baixado no primeiro uso de voz, com verificação de integridade. O GitHub Pages serve o modelo junto com o site. Na ausência do arquivo local, builds de desenvolvimento podem baixar a mesma versão do Hugging Face. Se a Faber falhar, o site mostra o erro e mantém a resposta em texto. O serviço de reconhecimento do navegador pode processar o áudio remotamente. A interface por texto funciona mesmo sem permissão de microfone.

## Créditos

- [Open Bot Avatar](https://github.com/DominikScholz/open-bot-avatar), de Dominik Scholz, sob [licença MIT](public/licenses/open-bot-avatar.txt).
- Space Grotesk, distribuída por Fontsource, sob [SIL Open Font License](public/licenses/space-grotesk.txt).
- [Faber](https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/pt/pt_BR/faber/medium/MODEL_CARD), da coleção Piper Voices (MIT). O Boti usa a versão original, com os mesmos parâmetros do Co Host (velocidade 1.0, expressividade 1.3).
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) (MIT) e [Piper Wasm](https://github.com/diffusionstudio/piper-wasm#readme), com [Piper Phonemize](https://github.com/wide-video/piper-phonemize) e [eSpeak NG](https://github.com/rhasspy/espeak-ng). [Código-fonte e avisos de licença](public/licenses/piper-wasm-sources.txt).
