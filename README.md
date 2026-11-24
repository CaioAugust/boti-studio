# Boti Studio

Converse por texto e voz com um avatar 3D. [Abra a demonstração no GitHub Pages](https://caioaugust.github.io/boti-studio/).

## Como usar

- **Modo demo.** Peça uma curiosidade ou uma piada para testar o chat com respostas prontas.
- **API.** Escolha OpenAI ou Anthropic (Claude), informe sua chave e ajuste o identificador do modelo, se necessário. As respostas mudam a expressão do avatar conforme o tom.
- **Voz.** Use o microfone para ditar em português do Brasil, revise a transcrição e envie. Clique em **Ouvir** em uma resposta ou marque **Ler respostas em voz alta**.
- **Avatar.** Teste cinco expressões e alterne entre pelúcia e superfície lisa. O renderizador usa WebGL2 para a pelúcia e exibe a superfície lisa em dispositivos sem suporte.

## Rodar localmente

Requer Node.js 22.12 ou mais recente.

```sh
npm ci
npm run dev
```

Para conferir a versão que vai para o GitHub Pages, rode `npm run build` e `npm run preview`. O GitHub Pages serve a raiz da branch `gh-pages`. Para atualizar o site, publique nela o conteúdo de `dist` e mantenha o arquivo `.nojekyll`.

## Chaves, dados e compatibilidade

O protótipo é estático e não usa banco de dados. A chave e o histórico ficam na memória da aba e são descartados ao recarregar ou fechar a página. O navegador envia a chave e o contexto recente da conversa diretamente à API escolhida. As chamadas estão sujeitas a cobrança, limites e permissões do provedor. Use uma chave dedicada a testes com as menores permissões possíveis. Para produção, proteja as chaves em um backend, conforme as [orientações da OpenAI](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety).

O ditado e a leitura usam a Web Speech API. A disponibilidade e as vozes dependem do navegador e do sistema. O serviço de reconhecimento do navegador pode processar o áudio remotamente. A interface por texto funciona mesmo sem permissão de microfone.

## Créditos

- [Open Bot Avatar](https://github.com/DominikScholz/open-bot-avatar), de Dominik Scholz, sob [licença MIT](public/licenses/open-bot-avatar.txt).
- Space Grotesk, distribuída por Fontsource, sob [SIL Open Font License](public/licenses/space-grotesk.txt).
