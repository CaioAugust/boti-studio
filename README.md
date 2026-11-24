# Boti Studio

Converse por texto e voz com um avatar 3D. [Abra a demonstração no GitHub Pages](https://caioaugust.github.io/boti-studio/).

## Como usar

- **API.** Escolha OpenAI ou Anthropic (Claude), informe sua chave e ajuste o identificador do modelo, se necessário. A chave é necessária para conversar por texto ou voz. A expressão do avatar acompanha o conteúdo da conversa.
- **Chamada.** Clique em **Iniciar chamada**, permita o acesso ao microfone e fale normalmente. O Boti responde em voz alta e volta a escutar. Clique em **Encerrar chamada** para desligar. No chat por texto, use **Ouvir** ou marque **Ler respostas em voz alta**.
- **Voz natural.** A OpenAI gera as falas do Boti com o modelo `gpt-audio-1.5` e a voz Coral, com entonação que acompanha a expressão. Se o chat usa OpenAI, a mesma chave serve para o áudio. Se você usa Claude, informe uma chave OpenAI opcional em **Configurar API** para gerar a voz. A geração de áudio usa créditos da OpenAI.
- **Avatar.** O avatar reage automaticamente e mantém a expressão da resposta durante a leitura em voz alta. Você pode alternar entre pelúcia e superfície lisa. O renderizador usa WebGL2 para a pelúcia e exibe a superfície lisa em dispositivos sem suporte.

## Rodar localmente

Requer Node.js 22.12 ou mais recente.

```sh
npm ci
npm run dev
```

Para conferir a versão que vai para o GitHub Pages, rode `npm run build` e `npm run preview`. O GitHub Pages serve a raiz da branch `gh-pages`. Para atualizar o site, publique nela o conteúdo de `dist` e mantenha o arquivo `.nojekyll`.

## Chaves, dados e compatibilidade

O protótipo é estático e não usa banco de dados. As chaves e o histórico ficam na memória da aba e são descartados ao recarregar ou fechar a página. O navegador envia a chave e o contexto recente da conversa diretamente à API escolhida. As chamadas estão sujeitas a cobrança, limites e permissões do provedor. Use uma chave dedicada a testes com as menores permissões possíveis. Para produção, proteja as chaves em um backend, conforme as [orientações da OpenAI](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety).

A chamada usa a Web Speech API em português do Brasil. O navegador reconhece a fala e envia o texto reconhecido para a mesma conversa usada pelo chat. Só o texto vai para a API de IA. Quando a voz natural está ativa, somente o texto das respostas reproduzidas é enviado à OpenAI para gerar o áudio. O site usa a voz do navegador quando a geração fica indisponível ou quando o Claude está configurado sem uma chave de voz. Nesse caso, o timbre depende das vozes disponíveis no dispositivo. O serviço de reconhecimento do navegador pode processar o áudio remotamente. A interface por texto funciona mesmo sem permissão de microfone.

## Créditos

- [Open Bot Avatar](https://github.com/DominikScholz/open-bot-avatar), de Dominik Scholz, sob [licença MIT](public/licenses/open-bot-avatar.txt).
- Space Grotesk, distribuída por Fontsource, sob [SIL Open Font License](public/licenses/space-grotesk.txt).
