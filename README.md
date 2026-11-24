# claude-skills-public

Skills e plugins do Claude Code, prontos para instalar.

## Instalar

No Claude Code:

```text
/plugin marketplace add Tarcisio-Abbud/claude-skills-public
/plugin install second-opinion@claude-skills-public
/plugin install desktop-statusline@claude-skills-public
```

Reinicie o Claude Code depois de instalar. Para atualizar mais tarde:

```text
/plugin marketplace update claude-skills-public
```

## Plugins

### second-opinion

Uma segunda opinião sobre a questão em que a sessão está mergulhada. Um subagente novo, que não
viu a conversa, recebe só a pergunta e as evidências (arquivos e trechos citados), forma o
próprio veredito e depois ataca a posição da sessão.

```text
/second-opinion:second-opinion              # discute até consenso, no máximo 3 respostas
/second-opinion:second-opinion once         # uma opinião só
/second-opinion:second-opinion consensus 5  # até consenso, no máximo 5 respostas
```

Usa o modelo Fable; se a conta não tiver acesso a ele, cai no Opus automaticamente. Roda com
esforço alto, então gasta mais que uma resposta comum.

### desktop-statusline

Para o app Desktop (aba Code): uma faixa acima da caixa de mensagem com a pasta, quanto do
contexto já foi usado e os limites de 5 horas e semanal, em verde, amarelo ou vermelho. No
terminal não muda nada.

## Licença

MIT
