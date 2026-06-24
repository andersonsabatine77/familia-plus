# 👨‍👩‍👧‍👦 Família+

Aplicativo completo de gestão familiar para Android. Finanças, filhos, compras e calendário — 100% offline.

---

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js v18+ (testado com v24.16.0)
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go no celular (Android) **ou** emulador Android

### Passos

```bash
# 1. Entrar na pasta do projeto
cd "Família+"

# 2. Instalar dependências (use --legacy-peer-deps por compatibilidade)
npm install --legacy-peer-deps

# 3. Iniciar o servidor de desenvolvimento
npx expo start

# 4. No terminal, pressione:
#    a  → abre no emulador Android
#    s  → mostra QR code para Expo Go
```

### Executar direto no Android

```bash
npx expo start --android
```

---

## 📱 Funcionalidades

### 💰 Finanças
- **Receitas**: salário, extras, outras entradas
- **Despesas**: gastos fixos e variáveis com vencimento
- **Gráficos**: pizza por categoria e barra comparativa
- **Alertas**: contas vencidas destacadas em vermelho
- **Sugestões de economia**: identifica o maior gasto do mês
- Filtro por categoria e navegação por mês

### 👶 Filhos
- Cadastro com nome, data de nascimento e escola
- **Escola**: reuniões, provas, notas, contatos
- **Saúde**: consultas, medicações, vacinas, alergias, tipo sanguíneo
- **Atividades extracurriculares**: nome, horário, local
- Badge de eventos próximos no card

### 🛒 Compras
- **Lista de Mercado**: itens com quantidade, preço e categoria
- Checkbox de comprado com barra de progresso
- Compartilhamento via WhatsApp com valor total
- **Lista para Casa**: itens com prioridade (Alta/Média/Baixa) e status (Planejado → Em compra → Comprado)

### 📅 Calendário
- Grade mensal visual com pontos coloridos por categoria
- Toque no dia para ver eventos
- Categorias com cores: Contas, Reuniões, Provas, Consultas, Aniversários, Outros
- Filtro por categoria e lista do mês

### ⚙️ Configurações
- Tema claro/escuro (persiste entre sessões)
- Gerenciar membros da família com número de WhatsApp
- Notificações push: alertas de contas com 1, 3 ou 7 dias de antecedência
- Exportar backup (JSON compartilhável)
- Limpar todos os dados

---

## ☁️ Sincronização entre celulares (compartilhar com a família)

Por padrão o app é **100% offline**. Se você quiser que **duas ou mais pessoas
vejam e editem os mesmos dados em tempo real** (e os lembretes de conta/consulta/
remédio toquem em todos os aparelhos), basta ligar a sincronização com o
**Firebase** — gratuito, sem cartão.

### Como funciona
- Um aparelho **cria uma família** e recebe um **código** (ex: `PNK7QD`).
- O outro aparelho usa **"Entrar com código"** e digita esse código.
- A partir daí, tudo que um adiciona aparece no outro automaticamente, nos dois
  sentidos. Cada celular agenda seus próprios lembretes a partir dos dados
  sincronizados — por isso as notificações funcionam em todos eles.

> O código da família é a "senha". Compartilhe só com quem deve ter acesso.

### Configuração (uma única vez, ~5 minutos)

1. Acesse <https://console.firebase.google.com> e **crie um projeto** (pode
   desativar o Google Analytics).
2. Menu **Build → Firestore Database → Criar banco de dados** → modo de
   **produção** → região **`southamerica-east1`**.
3. ⚙ **Configurações do projeto → Seus apps →** ícone **`</>` (Web)** → registre
   um app. O Firebase mostra um objeto `firebaseConfig` com 6 valores.
4. Cole esses 6 valores em **`src/firebase/config.js`**, substituindo os
   `COLE_AQUI_...`.
5. No Firestore, abra a aba **Regras** e cole exatamente isto, depois
   **Publicar**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /families/{familyId} {
         allow read, write: if true;
       }
     }
   }
   ```

6. Gere o APK novamente (push no GitHub aciona o build) e instale a nova versão.
   Pronto: em **Configurações → Compartilhar com a Família** aparecem os botões
   **Criar família** e **Entrar com código**.

> Enquanto `config.js` estiver com os valores `COLE_AQUI`, o app continua
> funcionando normalmente offline e a seção de sincronização fica oculta/avisa
> que o Firebase não está configurado.

### Limites do plano grátis (Spark)
Mais que suficiente para uma família: 1 GB armazenado, 50 mil leituras e 20 mil
escritas por dia. Um uso familiar normal fica numa fração disso.

---

## 🏗️ Estrutura do Projeto

```
Família+/
├── App.js                    ← Entrada principal
├── app.json                  ← Configuração Expo
├── package.json
└── src/
    ├── components/           ← Componentes reutilizáveis
    │   ├── FinancialCard.js
    │   ├── ChildCard.js
    │   ├── ShoppingItem.js
    │   ├── CalendarEvent.js
    │   ├── ThemeToggle.js
    │   └── CustomButton.js
    ├── screens/              ← Telas principais
    │   ├── FinancialScreen.js
    │   ├── ChildrenScreen.js
    │   ├── ShoppingScreen.js
    │   ├── CalendarScreen.js
    │   └── SettingsScreen.js
    ├── navigation/
    │   └── RootNavigator.js  ← Bottom Tab Navigator
    ├── context/
    │   ├── ThemeContext.js   ← Gerencia tema claro/escuro
    │   └── DataContext.js    ← Estado global + persistência
    ├── utils/
    │   ├── storage.js        ← AsyncStorage + dados iniciais
    │   ├── notifications.js  ← Expo Notifications
    │   ├── whatsapp.js       ← Integração WhatsApp
    │   └── formatters.js     ← Data, moeda, helpers
    └── styles/
        ├── colors.js         ← Paleta tema claro + escuro
        └── spacing.js        ← Espaçamento, tipografia, sombras
```

---

## 💾 Dados Persistidos

Todos os dados são salvos localmente no dispositivo usando `AsyncStorage`:

| Chave | Conteúdo |
|-------|----------|
| `@familia_plus:finances` | Receitas e despesas |
| `@familia_plus:children` | Filhos e seus sub-dados |
| `@familia_plus:shopping` | Listas de mercado e casa |
| `@familia_plus:calendar` | Eventos do calendário |
| `@familia_plus:family` | Membros da família |
| `@familia_plus:settings` | Tema, notificações |

**Dados de exemplo** são carregados automaticamente na primeira execução.

---

## 🔔 Notificações

Configuradas via `expo-notifications`. Tipos suportados:

- **Contas a vencer**: 1, 3 e 7 dias antes (configurável)
- **Eventos do calendário**: 1 hora antes
- **Medicações**: diárias em horário específico

---

## 📦 Dependências Principais

| Pacote | Uso |
|--------|-----|
| `expo ~56.0.11` | Plataforma principal |
| `@react-navigation/bottom-tabs` | Navegação por abas |
| `@react-native-async-storage/async-storage` | Persistência local |
| `expo-notifications` | Notificações push |
| `react-native-chart-kit` | Gráficos de pizza e barra |
| `react-native-svg` | Suporte a SVG para gráficos |
| `expo-linking` | Deep links / WhatsApp |

---

## 🛠️ Solução de Problemas

**Erro de peer deps ao instalar:**
```bash
npm install --legacy-peer-deps
```

**Gráficos não aparecem:**
```bash
npm install react-native-svg --legacy-peer-deps
```

**App não abre no emulador:**
```bash
npx expo doctor   # verifica problemas de configuração
```

**Limpar cache do Expo:**
```bash
npx expo start --clear
```

---

## 📄 Licença

MIT — uso pessoal e familiar livre.
