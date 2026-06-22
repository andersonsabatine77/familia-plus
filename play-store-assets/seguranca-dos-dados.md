# Segurança dos Dados (Data Safety) — Família+

Respostas para o questionário do Google Play Console.
Resumo: o app é 100% offline, não coleta nem compartilha nada. As respostas abaixo refletem isso.

---

## Seção 1 — Coleta e compartilhamento de dados

**O seu app coleta ou compartilha algum dos tipos de dados de usuário exigidos?**
→ **NÃO**

> Justificativa: todos os dados (finanças, filhos, listas, agenda, telefones) são
> gravados apenas no dispositivo, via armazenamento local. Nada é enviado para
> servidores nossos ou de terceiros, não há login nem conta.

Como respondeu "Não" aqui, o Play normalmente **não** pede as seções de detalhamento
por tipo de dado. Se mesmo assim aparecerem, use as respostas abaixo.

---

## Seção 2 — Práticas de segurança

**Os dados são criptografados em trânsito?**
→ Não se aplica (o app não transmite dados pela rede).
   Se o formulário obrigar uma resposta, marque "Sim" — não há tráfego de dados do usuário.

**Você oferece uma forma de o usuário solicitar a exclusão dos dados?**
→ **SIM** — O usuário pode apagar todos os dados na tela Configurações
   ("Limpar todos os dados") ou desinstalando o app.

---

## Seção 3 — Detalhamento por tipo de dado (só se for solicitado)

Para CADA tipo de dado abaixo, a resposta de coleta/compartilhamento é **NÃO**,
porque tudo fica local no aparelho:

- Informações pessoais (nome, e-mail, telefone): **Não coletado / Não compartilhado**
- Informações financeiras (despesas, receitas): **Não coletado / Não compartilhado**
- Informações de saúde (dados dos filhos): **Não coletado / Não compartilhado**
- Contatos / números de WhatsApp: **Não coletado / Não compartilhado**
- Localização: **Não coletado**
- Identificadores do dispositivo: **Não coletado**
- Fotos: **Não coletado** (caso adicione foto de filho, ela fica só no dispositivo)

---

## Seção 4 — Permissões declaradas (para referência)

- **POST_NOTIFICATIONS / Notificações**: lembretes locais de contas, eventos e remédios.
- **RECEIVE_BOOT_COMPLETED**: reagendar lembretes locais após reiniciar o celular.
- **VIBRATE**: vibração das notificações.

Nenhuma permissão é usada para coletar ou enviar dados.

---

## Observação importante (WhatsApp)
O app NÃO envia mensagens automaticamente nem lê conversas. Ao tocar no botão de
WhatsApp, ele apenas abre o WhatsApp com um texto pronto para o usuário enviar
manualmente. Por isso, não há coleta nem compartilhamento de dados.
