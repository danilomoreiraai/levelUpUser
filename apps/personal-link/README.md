# Páginas de links

O painel em `/admin` administra várias páginas com uma conta. Visitantes abrem a versão publicada
pelo endereço `/<slug>`. A separação entre rascunho e publicação também vale para as imagens. A
composição da página pública segue o [modelo julianaLinktree](https://github.com/danilomoreiraai/julianaLinktree).
A vitrine antes do login é alimentada pelas versões publicadas das páginas e carrega os
clientes em lotes. Retirar uma página do ar a remove da vitrine.

## Edição com o cliente

Abra uma página em `/admin` e, na seção **Acesso do cliente**, selecione **Gerar link de edição**.
Copie o endereço completo e envie-o ao cliente, que pode editar o rascunho, publicar ou retirar do
ar somente essa página. O endereço público continua separado. O painel mostra o endereço de edição
quando ele é gerado. Guarde-o para reenviar ou gere um novo. Gerar outro link ou revogar o atual
encerra o acesso pelo endereço anterior, inclusive para quem já tinha aberto o editor.

O editor acrescenta `https://` a endereços como `google.com` e preserva o protocolo quando informado.

## Execução local

Use Node.js 24 e um banco PostgreSQL 18 dedicado. A partir de `apps/personal-link`:

Copie `.env.example` para `.env` e, se quiser exibir os links de navegação do painel,
preencha `VITE_LEVELUP_SITE_ORIGIN` com a origem do site, por exemplo `https://levelupuser.com`.

```bash
npm ci
npm run build
printf 'Senha do painel: '
IFS= read -rs personal_link_password
printf '\n'
printf '%s\n' "$personal_link_password" | node dist/server/hash-password.js
unset personal_link_password
```

Grave o hash gerado em `ADMIN_PASSWORD_HASH`. Configure a URL
privada do banco em `DATABASE_URL` e a origem local em `APP_ORIGIN`, por exemplo
`http://127.0.0.1:3000`. Execute `npm start` e abra `/admin` nessa origem. Para editar com
recarga automática no Vite, execute `npm run dev` em outro terminal e use a origem do Vite em
`APP_ORIGIN`.

```bash
npm run validate
npm run test:mutation
npx playwright install chromium
TEST_DATABASE_URL='postgresql://user:password@127.0.0.1:5432/personal_link_test' npm run test:e2e
```

O Playwright usa um banco de teste descartável e gera um hash próprio. Os projetos Chromium
cobrem desktop e emulação mobile.

## Primeira publicação no Coolify

1. Configure a variável pública de repositório `VITE_LEVELUP_SITE_ORIGIN` com a origem do site.
   Aguarde a aprovação da CI no commit de `main`. O job **Release container images** informa
   a imagem do editor pelo digest `sha256`. Verifique que o servidor Coolify consegue lê-la no
   GitHub Container Registry. Use o acesso de leitura do registry configurado no servidor para
   imagens privadas.
2. Em **Personal link**, configure PostgreSQL 18 com volume persistente e acesso privado. Use
   a URL interna no aplicativo e mantenha ambos no mesmo destino de rede.
3. Adicione um aplicativo do tipo **Docker Image** com o nome e o digest do editor, porta
   interna 3000 e health check HTTP em `/readyz`. Defina `APP_ORIGIN` como
   `https://links.levelupuser.com` e as variáveis `DATABASE_URL` e `ADMIN_PASSWORD_HASH` no
   ambiente de execução. Marque o hash como **Literal** para preservar os sinais de dólar.
   A imagem já contém o commit em `APP_RELEASE`. O servidor aplica as migrações do banco
   antes de atender requisições. Deixe a porta da aplicação acessível internamente pelo proxy.
   Para usar o IP do visitante no limite de tentativas, informe em `TRUSTED_PROXIES` somente
   os IPs ou CIDRs exatos dos proxies de ingresso que sanitizam o cabeçalho
   `X-Forwarded-For`. Separe as entradas por vírgula.
4. Configure `links.levelupuser.com` na zona DNS para o servidor Coolify e use esse domínio
   HTTPS no aplicativo. Verifique a cadeia TLS e a resposta `/readyz` com o commit esperado.
   Teste login e publicação com dados fictícios e retire a página de teste do ar.
5. Habilite os backups diários na aba **Backups** do banco. Rode um backup e importe uma cópia
   em outro banco PostgreSQL 18, com uma instância de teste e credenciais próprias. Verifique
   que um rascunho, uma publicação e suas imagens são recuperáveis. Confira o destino e a data
   do backup, sem incluir registros de clientes ou credenciais no PR.
6. Depois da verificação do editor, configure a variável pública de repositório
   `VITE_PERSONAL_LINK_ORIGIN` e publique a versão do site que habilita os cards. Confirme o
   SHA do site em `/release.json` e abra os três destinos.

[Aplicativo Docker Image no Coolify](https://coolify.io/docs/applications/deployments/docker-image) ·
[PostgreSQL no Coolify](https://coolify.io/docs/databases/postgresql) ·
[Backups e recuperação](https://coolify.io/docs/databases/backups)

## Reversão

Registre a imagem anterior e a configuração do serviço do site antes da promoção. Para
reverter a vitrine, restaure a referência anterior no Compose do site, aplique a mudança e
verifique `/release.json`. Em uma primeira publicação do editor, pare somente o aplicativo
para preservar o volume e os backups. Em versões seguintes, use o digest anterior quando
compatível com o esquema atual do banco. Teste em uma cópia isolada qualquer restauração de
dados necessária.

## Foto do Instagram

Em **Perfil**, cole o link do perfil ou informe o @ e use **Buscar foto do Instagram** para
carregar a prévia. A foto entra no rascunho quando você salva. Você também pode enviar um arquivo
ao editar qualquer perfil.

A integração usa o Business Discovery da Meta, que pesquisa contas profissionais. Para ativar
no Coolify, configure `INSTAGRAM_GRAPH_API_URL` com a origem versionada da Graph API,
`INSTAGRAM_BUSINESS_ACCOUNT_ID` com o ID da conta profissional vinculada ao app e
`INSTAGRAM_GRAPH_ACCESS_TOKEN` com um token de usuário do Facebook que tenha acesso à conta profissional e as permissões
`instagram_basic`, `instagram_manage_insights` e `pages_read_engagement`. Para funções de Página
atribuídas pelo Gerenciador de Negócios, consulte as permissões adicionais em
[Business Discovery](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery).
