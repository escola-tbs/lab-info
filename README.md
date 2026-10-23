# 🏫 Sistema de Reservas do Laboratório de Informática - Escola TBS

Aplicação web moderna, intuitiva e responsiva para gerenciar as reservas do laboratório de informática e dos Chromebooks da **Escola Estadual de Ensino Fundamental e Médio Profª Terezinha Bezerra Siqueira (TBS)**, desenvolvida no âmbito do **Programa Institucional de Bolsa de Iniciação à Docência (PIBID)**.

O sistema permite que professores e bolsistas consultem a agenda de ocupação em tempo real, reservem horários com verificação atômica de conflitos e negociem horários diretamente via WhatsApp.

---

## 🚀 Funcionalidades Principais

- **Consulta Pública da Agenda**: Qualquer pessoa (professores, alunos e visitantes) pode visualizar a grade de horários sem precisar de login.
- **Divisão em Turnos e Horários Oficiais**:
  - **Manhã (07:00 às 12:00)**: 6 horários fixos + Intervalo (09:30 às 09:45).
  - **Tarde (13:30 às 18:30)**: 6 horários fixos + Intervalo (16:00 às 16:15).
  - Intervalos/recreios destacados visualmente e bloqueados para reserva.
- **Controle Separado por Recurso**:
  - 🖥️ + 💻 *Laboratório + Chromebooks*: Reserva conjunta do espaço e dos equipamentos.
  - 🖥️ *Apenas Laboratório*: Reserva do espaço físico (Chromebooks continuam livres para outro professor).
  - 💻 *Apenas Chromebooks*: Reserva dos aparelhos portáteis para a sala de aula (Laboratório continua livre).
- **Prevenção Atômica de Conflitos**: Validação segura via transações do Firestore que impedem duplicidades ou reservas simultâneas do mesmo recurso.
- **Senha Institucional de Acesso**: Proteção adicional para novas reservas, editável e gerenciável diretamente no Painel ADM.
- **Negociação via WhatsApp**: Botão com link direto para o WhatsApp do professor responsável com mensagem compacta pronta para facilitar trocas amigáveis.
- **Notificações em Tempo Real para Administradores**: Alertas nativos e sinal sonoro no celular ou computador do administrador sempre que uma nova reserva é concluída.
- **Painel Administrativo Completo**:
  - Gerenciamento de e-mails de administradores autorizados.
  - Alteração da senha institucional de acesso.
  - Controle e teste de notificações push para ADMs.
  - Alternância entre aprovação automática ou pré-aprovação de reservas.
  - Cancelamento e aprovação de reservas com 1 clique.
- **Hospedagem Estática Gratuita**: Funciona 100% no **GitHub Pages** e no **Firebase (Plano Spark Gratuito)** sem custos de servidor.
- **Suporte a PWA Completo**: Os professores podem instalar o sistema na tela inicial do celular (Android e iOS/Safari) ou no computador, com rotação de tela livre (vertical e horizontal) e carregamento instantâneo.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** + **TypeScript** + **Vite**
- **Vite Plugin PWA** (Service Worker, Web App Manifest e cache automático)
- **Tailwind CSS v4**
- **Firebase Authentication** (Login seguro com Google)
- **Cloud Firestore** (Banco de dados em tempo real com regras de segurança)
- **Lucide React** (Ícones modernos)
- **GitHub Actions / gh-pages** (Deploy automatizado)

---

## 📦 Como Instalar e Rodar no seu Computador

### Passo 1: Clonar o Repositório
Abra o terminal do Git (Git Bash, Prompt de Comando ou terminal do VS Code) e digite:

```bash
git clone https://github.com/SEU-USUARIO/laboratorio-tbs.git
cd laboratorio-tbs
```

*(Substitua `SEU-USUARIO/laboratorio-tbs` pelo link real do seu repositório no GitHub).*

---

### Passo 2: Instalar as Dependências

Execute o comando padrão:

```bash
npm install
```

---

### 🚨 O `npm install` deu erro? Veja como resolver:

É comum o `npm install` falhar em computadores que possuem versões antigas do Node.js, dependências desatualizadas ou cache corrompido. Siga as soluções abaixo na ordem:

#### 🔹 Solução 1: Conflito de dependências (Erro `ERESOLVE unable to resolve dependency tree`)
Como o projeto utiliza as versões mais recentes do React 19 e Tailwind v4, o npm pode ser rigoroso com conflitos secundários. Use a flag de compatibilidade:

```bash
npm install --legacy-peer-deps
```
*(Se ainda persistir, você pode usar `npm install --force`).*

#### 🔹 Solução 2: Versão antiga do Node.js ou do NPM
Este projeto requer **Node.js versão 18 ou superior** (recomendado: Node.js 20 LTS).
1. Verifique sua versão atual:
   ```bash
   node -v
   npm -v
   ```
2. Se o Node for inferior a `v18.0.0`, baixe a versão mais recente em [nodejs.org](https://nodejs.org/) (baixe a versão indicada como **LTS**).
3. Atualize o seu gerenciador `npm` para a versão mais recente com o comando:
   ```bash
   npm install -g npm@latest
   ```

#### 🔹 Solução 3: Limpeza de Cache e Instalação Limpa
Se arquivos temporários antigos estiverem corrompidos, faça uma limpeza completa:

- **No Windows (PowerShell):**
  ```powershell
  npm cache clean --force
  Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
  npm install --legacy-peer-deps
  ```

- **No Git Bash, Linux ou Mac:**
  ```bash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install --legacy-peer-deps
  ```

---

### Passo 3: Configurar as Credenciais do Firebase

Crie ou edite o arquivo chamado `firebase-applet-config.json` exatamente na pasta raiz do projeto. Ele contém as chaves que conectam a aplicação ao seu projeto no Firebase:

```json
{
  "projectId": "seu-projeto-firebase",
  "appId": "1:000000000000:web:000000000000",
  "apiKey": "AIzaSy...",
  "authDomain": "seu-projeto-firebase.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "seu-projeto-firebase.firebasestorage.app",
  "messagingSenderId": "000000000000",
  "measurementId": "",
  "oAuthClientId": "000000000000-xxxx.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
}
```

> 🔎 **Como obter cada uma dessas credenciais?** Veja o guia detalhado logo abaixo na seção [🔥 Guia Completo do firebase-applet-config.json](#-guia-completo-do-firebase-applet-configjson).

---

### Passo 4: Executar Localmente

```bash
npm run dev
```

Abra o seu navegador e acesse:
👉 `http://localhost:3000` (ou o endereço indicado no seu terminal).

---

## 🔥 Guia Completo do `firebase-applet-config.json`

Abaixo está a explicação exata de **onde e como obter cada valor** diretamente no [Firebase Console](https://console.firebase.google.com/) ou no [Google Cloud Console](https://console.cloud.google.com/):

| Linha / Chave | O que é | Onde obter no Console do Firebase / Google Cloud |
| :--- | :--- | :--- |
| **`projectId`** | ID único do seu projeto no Firebase. | Acesse o Firebase Console > clique na engrenagem ⚙️ (**Configurações do projeto**) no menu superior esquerdo > aba **Geral** > campo **ID do projeto** (*Project ID*). Ex: `laboratorio-tbs-12345`. |
| **`appId`** | Identificador único do aplicativo Web cadastrado. | No Firebase Console > ⚙️ **Configurações do projeto** > aba **Geral** > role até a seção **Seus aplicativos** (*Your apps*). No app web (`</>`), copie o valor de **ID do app** (*App ID*), no formato `1:123456789012:web:abcdef...`. |
| **`apiKey`** | Chave pública da API Web do Firebase. | No Firebase Console > ⚙️ **Configurações do projeto** > aba **Geral** > campo **Chave de API da Web** (*Web API Key*), ou dentro do objeto `firebaseConfig.apiKey` no seu app web. Começa tipicamente com `AIzaSy...`. |
| **`authDomain`** | Domínio oficial de autenticação para login Google. | É composto por `seu-projeto.firebaseapp.com`. Também pode ser copiado diretamente do bloco `firebaseConfig.authDomain` em **Seus aplicativos**. |
| **`firestoreDatabaseId`** | ID do banco de dados Cloud Firestore. | • **Para projetos convencionais criados no console:** use `"(default)"` (com parênteses e aspas).<br>• **Para projetos criados via Google AI Studio:** no menu lateral esquerdo vá em **Firestore Database**; no topo da página, ao lado do título, veja o nome do banco (ex: `ai-studio-9d5428d7-...`). Se estiver usando o padrão, preencha com `"(default)"`. |
| **`storageBucket`** | Bucket de armazenamento de arquivos. | Geralmente é `seu-projeto.firebasestorage.app` (ou `seu-projeto.appspot.com`). Disponível no objeto `firebaseConfig.storageBucket` ou na aba **Storage** do console. |
| **`messagingSenderId`** | Número do projeto no Google Cloud (Project Number). | No Firebase Console > ⚙️ **Configurações do projeto** > aba **Geral** > campo **Número do projeto** (*Project number*). É uma sequência exclusivamente numérica (ex: `144308504370`). |
| **`measurementId`** | ID do Google Analytics (*G-XXXXX*). | Opcional. Se não tiver ativado o Google Analytics, deixe com string vazia: `""`. |
| **`oAuthClientId`** | ID do Cliente OAuth 2.0 Web do Google. | • **Opção 1:** No Firebase Console > menu lateral **Authentication** > aba **Sign-in method** > clique no provedor **Google** e abra as configurações do SDK Web.<br>• **Opção 2:** No [Google Cloud Console](https://console.cloud.google.com/) > selecione o mesmo projeto > menu **APIs e Serviços** > **Credenciais** > seção **IDs do cliente OAuth 2.0** > copie o ID do cliente Web (termina em `.apps.googleusercontent.com`). *(Se preferir, pode manter `""`, mas é altamente recomendado para deploys web).* |
| **`recaptchaSiteKey`** | Chave do reCAPTCHA Enterprise / App Check. | Opcional para proteção contra bots. Pode ser deixado como string vazia: `""`. |

---

## 🛠️ Passo a Passo: Configuração Inicial do Firebase do Zero

Caso você esteja configurando um novo projeto Firebase para a sua escola:

1. **Criar o Projeto:**
   - Acesse o [Firebase Console](https://console.firebase.google.com/) com sua conta Google.
   - Clique em **Adicionar projeto** e dê um nome (ex: `laboratorio-tbs`). O Google Analytics é opcional.
2. **Registrar o Aplicativo Web:**
   - Na página inicial do projeto recém-criado, clique no ícone **Web (`</>`)**.
   - Dê um apelido ao app (ex: `TBS Web`) e clique em **Registrar app**.
   - O Firebase exibirá um código com o objeto `firebaseConfig`. Use esses valores para preencher o `firebase-applet-config.json`.
3. **Ativar o Login com Google (Authentication):**
   - No menu lateral esquerdo, acesse **Criação** (Build) > **Authentication**.
   - Clique em **Vamos começar** > aba **Sign-in method** > clique em **Google**.
   - Marque a chave **Ativar**, defina o *E-mail de suporte do projeto* e clique em **Salvar**.
4. **Criar o Banco de Dados Cloud Firestore:**
   - No menu lateral, acesse **Criação** > **Firestore Database** > clique em **Criar banco de dados**.
   - Escolha o local do servidor (recomendado: `southamerica-east1` em São Paulo ou `us-central1`).
   - Inicie no modo de produção ou teste.
5. **Publicar as Regras de Segurança (`firestore.rules`):**
   - No menu **Firestore Database**, clique na aba **Regras** (*Rules*).
   - Apague todo o conteúdo existente, cole o conteúdo do arquivo `firestore.rules` deste repositório e clique no botão **Publicar**.
   - ⚠️ *Sem esta etapa, o Firebase bloqueará qualquer tentativa de salvar ou ler reservas com o erro de "Permissão negada" (`permission-denied`).*
6. **Cadastrar os Domínios Autorizados (*Authorized Domains*):**
   - Acesse **Authentication** > aba **Configurações** (*Settings*) > clique em **Domínios autorizados** (*Authorized domains*).
   - Clique em **Adicionar domínio** e cadastre:
     - `localhost` (para testes locais no seu computador)
     - `SEU-USUARIO.github.io` (o domínio onde seu site ficará publicado no GitHub Pages)
     - O domínio de visualização do Google AI Studio (caso esteja usando o AI Studio, veja a seção abaixo).

---

## 🔄 O que fazer caso este projeto seja REMIXADO no Google AI Studio para uma nova Conta do Google

Se você (ou outro professor/bolsista) fizer um **Remix (Duplicação/Clone)** deste applet dentro da plataforma **Google AI Studio** para uma nova conta Google, siga estas etapas essenciais para que tudo funcione perfeitamente:

### 1. Aceitar o Provisionamento do Firebase no AI Studio
Ao remixar o applet, o AI Studio detectará a integração com o Firebase. Quando a janela modal de configuração do Firebase for exibida na tela do AI Studio Build, clique em **Confirmar / Aceitar**. O AI Studio criará automaticamente os recursos no Google Cloud vinculados à sua nova conta.

### 2. Atualizar o arquivo `firebase-applet-config.json`
Verifique se o arquivo `firebase-applet-config.json` na raiz do projeto foi atualizado com o novo `projectId` e as credenciais geradas para a sua nova conta do Google. Se necessário, abra o [Firebase Console](https://console.firebase.google.com/) da nova conta e copie as credenciais conforme a tabela do guia acima.

### 3. Ativar o Provedor Google no Firebase Authentication
Mesmo que o AI Studio provisione o Firestore automaticamente:
1. Abra o [Firebase Console](https://console.firebase.google.com/) logado na sua nova conta do Google.
2. Selecione o projeto criado para o applet.
3. Vá em **Authentication** > aba **Sign-in method**.
4. Se o provedor **Google** não estiver ativo, clique em **Adicionar novo provedor** > **Google** > marque **Ativar**, selecione o seu e-mail de suporte e clique em **Salvar**.

### 4. Publicar as Regras de Segurança do Firestore (`firestore.rules`)
O banco Firestore do novo projeto precisa das permissões de acesso:
1. No Firebase Console do novo projeto, acesse **Firestore Database** > aba **Regras** (*Rules*).
2. Certifique-se de que o conteúdo do arquivo `firestore.rules` deste repositório esteja colado lá e clique em **Publicar**.

### 5. Adicionar a URL do AI Studio nos Domínios Autorizados
O AI Studio executa a aplicação em um endereço de nuvem seguro (terminado em `run.app`, por exemplo `ais-dev-xxxx.run.app` ou `ais-pre-xxxx.run.app`). Para que o botão de login com o Google funcione dentro do preview do AI Studio:
1. No Firebase Console > **Authentication** > aba **Configurações** (*Settings*) > **Domínios autorizados**.
2. Clique em **Adicionar domínio**.
3. Adicione `run.app` (ou o domínio completo da barra de endereços do seu preview do AI Studio).
4. Adicione também `localhost` e seu futuro domínio do GitHub Pages (`seu-usuario.github.io`).
> 💡 *Se você pular esta etapa, ao tentar fazer login o Google exibirá o erro `auth/unauthorized-domain`.*

### 6. Configurar o seu E-mail como Administrador Inicial
Para que você tenha acesso imediato ao **Painel Administrativo** da escola (para gerenciar senhas, aprovações e cancelamentos):
1. Abra o arquivo `src/types.ts` no código do projeto.
2. Localize a constante `INITIAL_ADMIN_EMAILS` (por volta da linha 121):
   ```typescript
   export const INITIAL_ADMIN_EMAILS = [
     'seu-email@gmail.com', // 👈 Substitua pelo seu e-mail Google
   ];
   ```
3. Salve o arquivo. Agora, assim que você fizer login com essa conta Google, o botão com o escudo do **Painel Administrativo** aparecerá automaticamente no topo da página!

---

## 🚀 Como Mudar do Modo de Testes para o Modo de Produção

Quando você cria um projeto no Firebase ou desenvolve a aplicação pela primeira vez, vários serviços iniciam por padrão em **Modo de Teste** (*Testing Mode*). Para liberar o sistema com segurança máxima para todos os professores e funcionários da escola, siga este checklist essencial:

### 1. Substituir as Regras de Teste do Firestore pelas Regras de Produção
- **O risco do Modo de Teste:** No modo de teste padrão do Firebase, o banco de dados vem com regras temporárias que expiram em 30 dias (`if request.time < timestamp.date(...)`). Quando essa data expira, o sistema para de funcionar e ninguém mais consegue criar ou visualizar reservas!
- **Como mudar para Produção:**
  1. Acesse o [Firebase Console](https://console.firebase.google.com/) > seu projeto.
  2. No menu lateral, clique em **Firestore Database** > aba **Regras** (*Rules*).
  3. Apague qualquer regra provisória existente e cole o código completo do arquivo `firestore.rules` deste repositório.
  4. Clique no botão **Publicar** (*Publish*).
  5. ✅ **Pronto:** As regras de produção agora protegem os dados por tempo indeterminado, garantem a privacidade da LGPD (números de WhatsApp visíveis apenas para a escola) e impedem que um usuário altere ou cancele reservas de outro professor.

---

### 2. Publicar a Tela de Consentimento OAuth do Google (Sair do Modo "Teste")
- **O problema do Modo de Teste no OAuth:** Quando a autenticação do Google é criada, a tela de consentimento do Google Cloud pode iniciar com o status **"Teste"** (*Testing*). Nesse modo, **apenas** os e-mails cadastrados previamente como "Usuários de teste" conseguem fazer login; se qualquer outro professor tentar entrar, o Google exibirá a mensagem de erro: *"Acesso bloqueado: este app ainda está em fase de teste"*.
- **Como publicar para Produção:**
  1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e selecione o projeto do seu Firebase (`gen-lang-client-...`).
  2. No menu lateral (ícone ☰ no canto superior esquerdo), vá em **APIs e Serviços** > **Tela de consentimento OAuth** (ou **Branding / Marca** na interface atualizada).
  3. No painel principal, localize o campo **Status de publicação** (*Publishing status*).
  4. Se estiver como **"Teste"** (*Testing*), clique no botão **Publicar aplicativo** (*Publish App*) e confirme na janela que aparecer.
  5. **Configuração dos Links e Campos Recomendados:**
     - **Nome do app:** `Sistema de Reservas - Lab Info TBS`
     - **E-mail de suporte:** Selecione seu e-mail no menu suspenso.
     - **Página inicial do aplicativo (*Home page*):** O endereço do seu GitHub Pages (ex: `https://escola-tbs.github.io/lab-info/`).
     - **Link da Política de Privacidade (*Privacy policy link*):** Já criamos uma página oficial no próprio projeto! Basta usar:  
       `https://escola-tbs.github.io/lab-info/privacidade.html` (substitua pelo seu usuário e repositório).
     - **Domínios autorizados (*Authorized domains*):** Adicione `github.io`.
     - **E-mail de contato do desenvolvedor:** Digite seu e-mail.
     - ⚠️ **Dica de ouro (NÃO clique em "Verificar marca"):** Deixe o campo **Logotipo do app** e o **Link dos Termos de Serviço** em branco. Subir logotipo ou clicar em "Verificar marca" exigiria comprovação burocrática de propriedade do domínio via Google Search Console. Como o sistema utiliza apenas escopos básicos não-sensíveis (`email`, `profile` e `openid`), a publicação para produção é **imediata, automática e definitiva**, sem precisar de auditoria humana do Google.

> 💡 **Por que a tela do Google exibe `Prosseguir para gen-lang-client-...firebaseapp.com`?**  
> Por diretrizes oficiais de segurança anti-phishing do Google Identity, quando uma aplicação utiliza escopos padrão e não possui auditoria de marca comercial com domínio próprio, o Google exibe com destaque o domínio técnico seguro do servidor de autenticação (`seu-projeto.firebaseapp.com`) para transparência do usuário. Isso é o comportamento oficial e esperado de todas as aplicações integradas com Firebase Auth no mundo e não afeta em nada a segurança ou a privacidade dos dados.

---

### 3. Ajustar os Domínios Autorizados para Produção
- No Firebase Console, acesse **Authentication** > aba **Configurações** (*Settings*) > **Domínios autorizados** (*Authorized domains*).
- Certifique-se de que o domínio definitivo onde a escola acessará o sistema esteja presente:
  - `seu-usuario.github.io` (endereço do seu GitHub Pages).
  - Mantenha `localhost` apenas se os desenvolvedores/bolsistas forem rodar testes no computador.
  - Se você usou o preview temporário do AI Studio e não for mais usá-lo, pode remover domínios temporários antigos.

---

### 4. Limpeza de Reservas Falsas de Teste no Banco de Dados
Durante o desenvolvimento, é comum criar reservas fictícias com nomes de teste:
1. No Firebase Console, vá em **Firestore Database** > aba **Dados** (*Data*).
2. Localize a coleção `reservations`.
3. Você pode excluir documentos de testes antigos clicando nos três pontinhos verticais ao lado de cada documento e selecionando **Excluir documento** (ou apagando a coleção inteira para começar do zero no ano letivo).
4. Na coleção `users`, mantenha os perfis dos professores reais cadastrados.

---

### 5. Configurar os Parâmetros Oficiais da Escola no Painel Administrativo
Com o sistema publicado:
1. Acesse o link oficial do site e faça login com a conta Google configurada como administrador.
2. Abra o **Painel Administrativo** (ícone do escudo no topo):
   - **Senha Institucional:** Altere ou defina uma senha interna pela direção/coordenação da escola (evitando que pessoas de fora façam reservas).
   - **Aprovação de Reservas:** Defina se novas reservas serão confirmadas automaticamente ou se exigirão pré-aprovação de um administrador.
   - **Administradores:** Adicione os e-mails dos coordenadores, diretor e bolsistas do PIBID autorizados a gerenciar os horários da escola.

---

### 6. Gerar o Pacote Otimizado de Produção (Build)
Sempre que for colocar o site no ar para a escola, certifique-se de que o código publicado foi gerado em modo de produção (com código minificado, estilos compactados e alta velocidade de carregamento):
- Se usar o GitHub Actions (Opção 1): o próprio GitHub gera o build de produção automaticamente a cada `git push`.
- Se fizer o deploy manual pelo terminal (Opção 2): o comando `npm run deploy` já executa automaticamente `npm run build` antes de enviar os arquivos para o GitHub Pages.

---

## 🌐 Como Fazer o Deploy no GitHub Pages (Passo a Passo)

O **GitHub Pages** é o serviço gratuito do GitHub que coloca o seu site no ar na internet. Você tem **duas opções** para fazer isso:

- **Opção 1 (Recomendada):** Pelo próprio GitHub com **GitHub Actions** (você **não precisa** ter Node.js instalado no seu computador, o próprio GitHub baixa, compila e publica tudo nas nuvens).
- **Opção 2:** Pelo **terminal do seu computador** usando o comando `npm run deploy` (você gera a versão de produção no seu computador e envia para o GitHub).

---

### 🌟 Opção 1: Deploy Automático nas Nuvens (GitHub Actions) — A Mais Fácil!

Nesta opção, todo o trabalho pesado de compilar os arquivos é feito pelos servidores do GitHub.

#### ⚠️ Passo 0: Habilitar o GitHub Pages no site do GitHub (Faça isso primeiro!)
Para evitar o erro comum `Creating Pages deployment failed - HttpError: Not Found`, ative o Pages antes do primeiro envio:

1. Acesse o seu repositório no **[github.com](https://github.com/)** pelo navegador.
2. Clique na aba **Settings** (Configurações) no topo da página.
3. No menu lateral esquerdo, clique em **Pages**.
4. Em **Build and deployment**, onde diz **Source**, clique no menu e mude de *"Deploy from a branch"* para **"GitHub Actions"**.
5. Pronto! Agora o GitHub já sabe que deve aceitar deploys automáticos.

#### Passo 1: Enviar as alterações do seu código pelo Terminal do Git
Abra o terminal na pasta do projeto (Git Bash, Terminal do VS Code ou Prompt de Comando) e execute estes 3 comandos:

```bash
# 1. Prepara todos os arquivos alterados para o envio
git add .

# 2. Cria um pacote com uma mensagem descrevendo o que você fez
git commit -m "Publicando site no GitHub Pages"

# 3. Envia o código para o GitHub
git push origin main
```

> 💡 **Dica de ouro:** Se o terminal der erro dizendo que a branch `main` não existe, é porque a branch principal do seu repositório se chama `master`. Nesse caso, basta rodar:
> ```bash
> git push origin master
> ```

#### Passo 2: Ver o site entrando no ar
1. No seu repositório no GitHub, clique na aba **Actions** no topo.
2. Você verá o processo **"Deploy to GitHub Pages"** rodando:
   - 🟡 **Bolinha amarela**: O GitHub está instalando e compilando o projeto nos servidores dele.
   - 🟢 **Bolinha verde**: Sucesso! O site está no ar.
3. Volte na aba **Settings > Pages**: o link do seu site estará em destaque no topo (ex: `https://seu-usuario.github.io/nome-do-repositorio/`).

---

### 🛠️ Opção 2: Deploy Direto pelo Terminal do Computador (`npm run deploy`)

Se você gosta de rodar os comandos no seu computador e quer enviar o site pronto diretamente para o GitHub:

> ⚠️ **Requisito:** Para esta opção, você precisa ter o **Node.js** instalado no seu computador e já ter executado `npm install` com sucesso na pasta do projeto.

#### Passo 1: Rodar o comando de publicação
No terminal da pasta do projeto, execute apenas:

```bash
npm run deploy
```

O que este comando faz automaticamente:
1. Executa `npm run build` (cria uma pasta chamada `dist/` com todos os arquivos HTML, CSS e JavaScript otimizados).
2. Usa o pacote oficial `gh-pages` para enviar essa pasta `dist/` para uma ramificação especial no GitHub chamada `gh-pages`.
3. Quando terminar, exibirá no terminal a palavra **`Published`**.

#### Passo 2: Configurar o GitHub para ler a branch gh-pages (Apenas na 1ª vez)
1. Acesse o seu repositório no **GitHub** pelo navegador.
2. Clique em **Settings** (Configurações) > menu lateral **Pages**.
3. Em **Build and deployment**:
   - Em **Source**, selecione **"Deploy from a branch"**.
   - Em **Branch**, escolha **`gh-pages`** e a pasta **`/(root)`**.
   - Clique no botão **Save** (Salvar).
4. Aguarde cerca de 1 minuto e atualize a página. O link do seu site estará no topo pronto para uso!

---

### 🔑 Lembrete Fundamental: Login do Google no GitHub Pages
Seja qual for a opção escolhida, para que o botão **"Entrar com Google"** funcione no site publicado:
1. Copie o endereço do seu site publicado (exemplo: `seu-usuario.github.io`).
2. Acesse o **[Firebase Console](https://console.firebase.google.com/)**.
3. Vá em **Authentication** > aba **Configurações (Settings)** > **Domínios Autorizados (Authorized Domains)**.
4. Clique em **Adicionar domínio** e cole `seu-usuario.github.io` (apenas o domínio, sem `https://` e sem a barra no final).
5. Salve. Agora qualquer professor da escola conseguirá fazer login normalmente!

---

## 🔒 Segurança e Regras de Privacidade (LGPD)

- **Proteção dos Telefones**: O contato de WhatsApp dos professores fica armazenado na coleção protegida `/user_contacts/{userId}`, visível apenas para usuários autenticados da escola (evitando que robôs ou pessoas de fora tenham acesso).
- **Controle de Acesso Baseado em Papéis (ABAC)**: As permissões de administradores e usuários comuns são validadas de forma estrita no servidor do Firestore através do `firestore.rules`.
- **Prevenção de Sobreposição**: A gravação de horários usa transações que impedem reservas duplicadas mesmo que dois professores cliquem no mesmo segundo.

---

## 👥 Contribuidores & Créditos

- **Escola Estadual de Ensino Fundamental e Médio Profª Terezinha Bezerra Siqueira (TBS)**
- **PIBID 2026** - Universidade Federal Rural da Amazônia (UFRA)
- Desenvolvido com foco na organização pedagógica e no uso eficiente dos recursos tecnológicos da escola.
