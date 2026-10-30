# NekoUrban — Plataforma de Inteligência Urbana

Aplicação web para registrar, acompanhar e gerenciar problemas urbanos por município. O NekoUrban permite que cidadãos comuniquem problemas da cidade, enquanto gestores municipais acompanham as ocorrências por meio de um painel com indicadores, gráficos e mapas.

## 1. Sobre o projeto

O NekoUrban foi desenvolvido para aproximar cidadãos e administração pública, facilitando a comunicação e o acompanhamento de problemas urbanos.

### Funcionalidades principais

**Para cidadãos**
- Criar uma conta e realizar login.
- Registrar problemas urbanos, como buracos, calçadas danificadas, descarte irregular de lixo e postes apagados.
- Informar a localização da ocorrência no mapa.
- Anexar fotografias.
- Consultar o andamento das ocorrências.
- Comentar e apoiar ocorrências registradas.
- Receber notificações internas.

**Para gestores municipais**
- Acessar um painel administrativo.
- Visualizar indicadores de ocorrências.
- Consultar gráficos por categoria e evolução mensal.
- Visualizar um mapa de calor com a concentração dos problemas.
- Consultar o ranking de bairros mais afetados.
- Filtrar ocorrências por categoria, status, bairro e período.
- Consultar o histórico de alterações de status.
- Exportar relatórios em CSV, compatíveis com o Microsoft Excel.

**Separação por município**

Os dados são filtrados de acordo com o município do usuário autenticado. Assim, um gestor só pode consultar as ocorrências do município ao qual está associado.

## 2. Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| Angular 21 | Interface do usuário |
| TypeScript | Desenvolvimento da aplicação |
| Express 5 | API e serviços do backend |
| Node.js | Ambiente de execução do backend |
| PostgreSQL | Banco de dados |
| Chart.js | Gráficos e indicadores |
| Leaflet | Mapas interativos |
| Leaflet.heat | Mapas de calor |
| JWT | Autenticação de usuários |

## 3. Requisitos para executar no Windows

Antes de iniciar, instale os seguintes programas:

### Node.js e npm

O Node.js é necessário para executar o backend e o frontend.

- Baixe a versão LTS em: https://nodejs.org/
- Durante a instalação, mantenha as opções padrão.
- O npm será instalado junto com o Node.js.

Para verificar a instalação, abra o PowerShell ou o Prompt de Comando e execute:

```powershell
node -v
npm -v
```

### PostgreSQL

O PostgreSQL é utilizado para armazenar os usuários, ocorrências, comentários, notificações e demais informações do sistema.

- Download: https://www.postgresql.org/download/windows/
- Instale o PostgreSQL 14 ou superior.
- Durante a instalação, defina uma senha para o usuário administrador do banco.
- Mantenha a porta padrão `5432`, caso ela esteja disponível.

Também é recomendável instalar o **pgAdmin 4**, que permite administrar o PostgreSQL por uma interface gráfica.

Download: https://www.pgadmin.org/download/

### Visual Studio Code (opcional)

O VS Code é recomendado para visualizar e editar o código-fonte.

Download: https://code.visualstudio.com/

## 4. Baixando o projeto

Existem duas maneiras de obter o NekoUrban.

### Opção A — Baixar pelo GitHub

1. Acesse o repositório do projeto.
2. Clique no botão **Code**.
3. Selecione **Download ZIP**.
4. Extraia o arquivo ZIP em uma pasta de sua preferência.

### Opção B — Clonar utilizando Git

Caso tenha o Git instalado, abra o terminal e execute:

```powershell
git clone URL_DO_REPOSITORIO
```

Depois, entre na pasta do projeto:

```powershell
cd NekoUrban
```

## 5. Configurando o banco de dados

Antes de iniciar o sistema, é necessário preparar o PostgreSQL.

### 5.1. Criar o banco

1. Abra o pgAdmin 4.
2. Conecte-se ao servidor PostgreSQL.
3. Clique com o botão direito em **Databases**.
4. Selecione **Create → Database**.
5. Informe o nome:

```text
nekourban
```

6. Salve.

### 5.2. Criar as tabelas

1. Selecione o banco `nekourban`.
2. Abra o **Query Tool**.
3. Abra o arquivo `database/schema.sql`.
4. Copie seu conteúdo para o Query Tool.
5. Execute o SQL.

Esse procedimento cria a estrutura necessária para o funcionamento do sistema.

**Atenção:** execute o `schema.sql` somente na primeira configuração de um banco vazio. Não execute novamente em um banco que já possui as tabelas e dados, pois o script pode apagar informações existentes.

### 5.3. Inserir dados iniciais

Após criar as tabelas:

1. Abra o arquivo `database/seed.sql`.
2. Copie seu conteúdo.
3. Cole no Query Tool do banco `nekourban`.
4. Execute o SQL.

Esse arquivo contém dados iniciais utilizados pelo sistema, incluindo municípios, categorias e contas de teste.

## 6. Configurando o backend

O backend precisa de um arquivo `.env` para acessar o banco de dados e configurar a autenticação.

1. Abra a pasta `backend`.
2. Localize o arquivo `.env.example`.
3. Faça uma cópia desse arquivo.
4. Renomeie a cópia para:

```text
.env
```

5. Abra o arquivo `.env` e configure os valores:

```env
PORT=3000
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/nekourban
JWT_SECRET=SUA_CHAVE_SECRETA
```

Substitua:

- `USUARIO`: usuário do PostgreSQL que possui acesso ao banco.
- `SENHA`: senha desse usuário.
- `SUA_CHAVE_SECRETA`: chave privada para autenticação JWT, com pelo menos 32 caracteres.

Não coloque os sinais `<` e `>` nos valores. Caso a senha contenha caracteres especiais, pode ser necessário codificá-los para uso na URL de conexão.

**Importante:** o arquivo `.env` contém informações privadas. Não o envie ao GitHub nem compartilhe publicamente.

## 7. Iniciando o NekoUrban

Depois de instalar os requisitos e configurar o banco de dados, você poderá iniciar o projeto.

Na pasta principal do NekoUrban, localize o arquivo:

```text
INICIAR.bat
```

Dê dois cliques nele para executar.

Na primeira inicialização, o script instala as dependências necessárias do projeto e inicia os serviços.

Aguarde até que o backend e o frontend estejam disponíveis.

Abra o navegador e acesse:

**http://localhost:4200**

O backend utiliza a porta `3000` e o frontend utiliza a porta `4200`.

### Iniciando manualmente

Se preferir iniciar os serviços separadamente, abra dois terminais.

**Terminal 1 — Backend**

```powershell
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend**

```powershell
cd frontend
npm install
npm start
```

A configuração do arquivo `backend/.env` e a disponibilidade do PostgreSQL continuam sendo necessárias.

## 8. Contas de teste

O arquivo `database/seed.sql` disponibiliza contas para testar os diferentes perfis.

| E-mail | Senha | Perfil | Município |
|---|---|---|---|
| `cidadao@exemplo.com` | `SenhaCidadao123` | Cidadão | Sorocaba/SP |
| `gestor@exemplo.com` | `SenhaForte123` | Gestor | Sorocaba/SP |
| `vizinho@exemplo.com` | `SenhaVizinha123` | Cidadão | Sorocaba/SP |
| `paulista@exemplo.com` | `SenhaPaulista123` | Cidadão | São Paulo/SP |

Essas credenciais são destinadas exclusivamente aos testes locais. Não utilize essas contas em uma instalação pública ou de produção.

### Criando uma conta de gestor

O cadastro público cria contas com perfil de cidadão.

Para criar outra conta de gestor, abra um terminal na pasta principal e execute:

```powershell
cd backend
npm run criar-gestor
```

Siga as instruções apresentadas no terminal.

## 9. Painel do gestor

O painel administrativo pode ser acessado por usuários autenticados com perfil de gestor.

### Indicadores
- Total de ocorrências.
- Ocorrências pendentes.
- Ocorrências em andamento.
- Ocorrências resolvidas.

### Gráficos
- Distribuição das ocorrências por categoria.
- Evolução mensal das ocorrências.

### Mapa de calor
Apresenta a concentração geográfica dos problemas registrados no município.

### Ranking de bairros
Exibe até 12 bairros com maior quantidade de ocorrências.

### Filtros
É possível filtrar os dados por:
- Categoria.
- Status.
- Bairro.
- Data inicial.
- Data final.

### Histórico
Apresenta até 200 alterações recentes de status, incluindo o gestor responsável e a data da alteração.

### Exportação CSV
Permite exportar até 10.000 ocorrências filtradas para um arquivo CSV, que pode ser aberto no Microsoft Excel.

## 10. Como testar o sistema

Depois de iniciar o banco, o backend e o frontend:

1. Acesse `http://localhost:4200`.
2. Entre utilizando uma conta de cidadão.
3. Registre uma ocorrência.
4. Informe sua descrição e localização.
5. Anexe uma fotografia, se desejar.
6. Consulte a ocorrência registrada.
7. Experimente comentar e apoiar uma ocorrência.
8. Saia da conta e entre com uma conta de gestor.
9. Acesse o Painel do gestor.
10. Consulte os indicadores, gráficos, mapa de calor e histórico.
11. Altere o status de uma ocorrência.
12. Teste os filtros e a exportação CSV.

## 11. Solução de problemas

### O comando `node` não é reconhecido

O Node.js pode não estar instalado corretamente ou não foi adicionado ao PATH do Windows.

Reinstale o Node.js LTS e reinicie o terminal.

### O comando `npm` não é reconhecido

Verifique a instalação do Node.js e do npm:

```powershell
node -v
npm -v
```

### Erro de conexão com o PostgreSQL

Confira:

- Se o serviço PostgreSQL está iniciado.
- Se a porta configurada é `5432`.
- Se o banco `nekourban` existe.
- Se o usuário e a senha do `DATABASE_URL` estão corretos.
- Se o arquivo `backend/.env` está configurado.

### Erro de dependências ou módulos ausentes

Abra um terminal na pasta correspondente e execute:

```powershell
npm install
```

Faça isso na pasta `backend` ou `frontend`, conforme o erro apresentado.

### O endereço localhost não abre

Confira se o backend e o frontend foram iniciados corretamente.

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`

Verifique também se as portas não estão sendo utilizadas por outros programas.

### O arquivo INICIAR.bat fecha imediatamente

Abra o PowerShell na pasta principal do projeto e tente iniciar os serviços manualmente, seguindo as instruções da seção 7. Assim, será possível visualizar as mensagens de erro.

## 12. Estrutura do projeto

```text
NekoUrban/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── scripts/
│   │   ├── auth.ts
│   │   ├── gestor.ts
│   │   ├── interacoes.ts
│   │   ├── notificacoes.ts
│   │   ├── ocorrencias.ts
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── index.html
│   │   └── styles.css
│   │
│   ├── angular.json
│   └── package.json
│
├── .gitignore
├── INICIAR.bat
├── README.md
└── package.json
```

## 13. API

O backend disponibiliza rotas para autenticação, ocorrências, comentários, apoios, notificações e gerenciamento municipal.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/gestor/indicadores` | Indicadores e dados do painel |
| GET | `/api/gestor/historico` | Histórico de alterações |
| GET | `/api/gestor/relatorio.csv` | Exportação de relatório |
| GET | `/api/ocorrencias` | Listagem de ocorrências |
| POST | `/api/ocorrencias` | Registro de ocorrência |
| GET | `/api/categorias` | Categorias disponíveis |
| GET | `/api/municipios` | Municípios ativos |
| GET | `/api/ocorrencias/:id/comentarios` | Comentários |
| POST | `/api/ocorrencias/:id/comentarios` | Publicação de comentário |
| POST | `/api/ocorrencias/:id/apoio` | Apoio a uma ocorrência |
| DELETE | `/api/ocorrencias/:id/apoio` | Remoção de apoio |
| GET | `/api/notificacoes` | Notificações do usuário |
| PATCH | `/api/notificacoes/:id/ler` | Marcar notificação como lida |
| PATCH | `/api/ocorrencias/:id/status` | Alteração de status pelo gestor |

As rotas protegidas exigem autenticação por JWT e respeitam a separação de dados por município.

## 14. Limitações e cuidados

O NekoUrban é um MVP (Produto Mínimo Viável). Algumas funcionalidades e cuidados ainda precisam ser considerados antes de uma implantação pública.

- O mapa começa centralizado em Sorocaba.
- O filtro de localização utiliza bairros, sem pesquisa por raio ou endereço.
- As fotografias ficam disponíveis publicamente pela rota `/uploads`.
- As notificações são internas, não sendo enviados e-mails ou notificações push.
- Os tokens JWT ficam armazenados em memória; após atualizar a página, é necessário realizar login novamente.
- O mapa de calor possui limite de 2.000 pontos.
- O histórico possui limite de 200 registros.
- A exportação CSV possui limite de 10.000 ocorrências.
- As fotografias possuem limite de 5 MB.
- Antes de uso em produção, são necessários testes de segurança, moderação de conteúdo, proteção de dados e adequação à LGPD.

**Não publique fotografias contendo rostos, placas de veículos ou informações pessoais.**

## 15. Segurança

Para manter a segurança do projeto:

- Nunca publique o arquivo `backend/.env`.
- Não coloque senhas reais ou tokens no código-fonte.
- Utilize senhas fortes e chaves JWT privadas.
- Não utilize as contas de teste em produção.
- Não exponha credenciais do PostgreSQL.
- Revise os dados iniciais antes de publicar o projeto.
- Faça backups do banco de dados.
- Antes de disponibilizar o sistema publicamente, implemente os cuidados necessários com privacidade e LGPD.

## 16. Objetivo do projeto

O NekoUrban busca oferecer uma ferramenta de participação cidadã e gestão urbana, facilitando a identificação de problemas municipais e fornecendo informações organizadas para apoiar a tomada de decisões.

**NekoUrban — Inteligência urbana para cidades melhores.**