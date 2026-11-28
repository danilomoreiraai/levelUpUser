"""Renderiza o retrato auditado; não executa uma nova auditoria automaticamente."""
from pathlib import Path
import os
os.environ.setdefault('MPLCONFIGDIR', '/tmp/levelup-audit-matplotlib')
import json
from html import escape
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
import fitz
D=Path(__file__).resolve().parent
scan=json.loads((D/'scan-results.json').read_text())
font=Path(matplotlib.get_data_path())/'fonts/ttf'
for name,file in [('Audit','DejaVuSans.ttf'),('AuditBold','DejaVuSans-Bold.ttf'),('AuditMono','DejaVuSansMono.ttf')]:
 pdfmetrics.registerFont(TTFont(name,str(font/file)))
pdfmetrics.registerFontFamily('Audit',normal='Audit',bold='AuditBold',italic='Audit',boldItalic='AuditBold')
S=getSampleStyleSheet()
S.add(ParagraphStyle(name='BodyAudit',fontName='Audit',fontSize=9,leading=14,spaceAfter=9,textColor=colors.HexColor('#334155')))
S.add(ParagraphStyle(name='TitleAudit',fontName='AuditBold',fontSize=26,leading=34,spaceAfter=22,textColor=colors.HexColor('#0F172A')))
S.add(ParagraphStyle(name='HeadingAudit',fontName='AuditBold',fontSize=16,leading=22,spaceAfter=14,textColor=colors.HexColor('#0F172A')))
S.add(ParagraphStyle(name='SmallAudit',fontName='Audit',fontSize=8.3,leading=12,spaceAfter=5,wordWrap='CJK'))
S.add(ParagraphStyle(name='CodeAudit',fontName='AuditMono',fontSize=7.2,leading=11,spaceAfter=9,backColor=colors.HexColor('#F1F5F9'),borderPadding=8,wordWrap='CJK'))
story=[]; markdown=[]
def p(t,style='BodyAudit'):
 story.append(Paragraph(escape(t).replace('\n','<br/>'),S[style]));markdown.append(t+'\n')
def h(t):
 if t.startswith('Pontos fortes'):
  story.append(Paragraph(escape(t),ParagraphStyle(name='StrongAudit',parent=S['HeadingAudit'],textColor=colors.HexColor('#059669'))));markdown.append(t+'\n')
 else:p(t,'HeadingAudit')
def page():story.append(PageBreak());markdown.append('\n---\n')
def table(headers,rows,widths):
 data=[[Paragraph(escape(str(c)),S['SmallAudit']) for c in r] for r in [headers]+rows]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E2E8F0')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F8FAFC')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),.5,colors.HexColor('#CBD5E1'))]))
 story.append(t);story.append(Spacer(1,12));markdown.extend([' | '.join(map(str,r))+'\n' for r in [headers]+rows])
# Cover
p('SEGURANÇA DE APLICAÇÕES • AUDITORIA DE CÓDIGO','SmallAudit');story.append(Spacer(1,42))
p('Relatório de Auditoria de Segurança — LevelUp User','TitleAudit')
p('21 de setembro de 2026 • pt-BR')
p('Resultado: 0 vulnerabilidades confirmadas nas cinco categorias solicitadas.')
p('Escopo: checkout local, código da aplicação e servidor estático, configuração, documentação, CI/deploy, histórico Git alcançável pelas referências locais e bundle de produção reconstruído.')
p('Revisão-base: '+scan['commit'],'CodeAudit')
p('Nota metodológica')
p('A stack foi identificada pelos arquivos reais, não pelo PRD de Brev.ly. Isolamento foi mapeado para persistência/tenant; autorização para gates de papel e ações HTTP; IDOR para todos os handlers; segredos para fonte, histórico e bundle; XSS para origem dos dados e destinos DOM/HTML/URL. A severidade exige um caminho de exploração comprovado.')
p('O repositório é um portfólio público. O encurtador aparece apenas como serviço “Coming soon”. Não foi inferida uma API que não existe.')
p('Ausência de achados não equivale a garantia de segurança. Configuração de produção, serviços externos e segredos do provedor não foram inspecionados.')
page();h('Resumo executivo')
labels=['Crítica','Alta','Média','Baixa','Informativa'];palette=['#B91C1C','#EA580C','#D97706','#2563EB','#64748B']
fig,axs=plt.subplots(1,2,figsize=(9,3.6),gridspec_kw={'width_ratios':[1,1.4]})
axs[0].pie([1],colors=['#E2E8F0'],wedgeprops={'width':.22},startangle=90);axs[0].text(0,0,'0\nachados',ha='center',va='center',fontsize=17,color='#0F172A');axs[0].set_title('Por severidade',fontsize=12)
from matplotlib.patches import Patch
axs[0].legend(handles=[Patch(color=c,label=l+' · 0') for l,c in zip(labels,palette)],loc='lower center',bbox_to_anchor=(.5,-.38),ncol=3,fontsize=7,frameon=False)
cats=['Isolamento (N/A)','Permissão (N/A)','IDOR (N/A)','Chaves expostas','XSS']
axs[1].barh(cats,[0]*5,color='#2563EB');axs[1].set_xlim(0,1);axs[1].set_xticks([0,1]);axs[1].invert_yaxis();axs[1].set_title('Por categoria',fontsize=12)
for i in range(5):axs[1].text(.02,i,'0',va='center',fontsize=10)
axs[1].spines[['top','right']].set_visible(False);axs[1].set_xlabel('Vulnerabilidades confirmadas');fig.tight_layout();fig.savefig(D/'charts.png',dpi=180,bbox_inches='tight');plt.close(fig)
from reportlab.lib.utils import ImageReader
chart_width,chart_height=ImageReader(str(D/'charts.png')).getSize()
chart=Image(str(D/'charts.png'),width=480,height=480*chart_height/chart_width)
story.append(chart);story.append(Spacer(1,18))
p('Crítica 0 • Alta 0 • Média 0 • Baixa 0 • Informativa 0. A rosca cinza representa ausência de achados; não atribui proporções a uma soma zero. N/A não significa controle de autorização testado: significa ausência dessa funcionalidade.')
table(['Categoria','Resultado e mapeamento'],[
('1. Banco sem tranca','Não aplicável. Sem banco, ORM, queries, usuários ou tenants. Nenhum mecanismo de isolamento é necessário à entrega de conteúdo público atual.'),
('2. Permissão no navegador','Não aplicável. Sem papéis, login, administração ou endpoints privilegiados. Consentimento de telemetria não é autorização de servidor.'),
('3. IDOR','Não aplicável a objetos privados. 1/1 handler HTTP auditado integralmente; não consulta nem altera objetos de negócio por ID.'),
('4. Chaves expostas','Aplicável; nenhuma credencial confirmada em fonte, histórico local ou bundle reconstruído.'),
('5. XSS','Aplicável no frontend; nenhum fluxo explorável confirmado. Backend não produz templates ou e-mails com input.')],[135,345])
page();h('Stack detectada e cobertura HTTP')
table(['Camada','Evidência'],[('Linguagem e frontend','TypeScript strict (tsconfig.app.json:16), React 18.3, React Router 7.18, Vite 5.4, Tailwind 3.4; package.json e lockfile.'),('Servidor','Node.js 20 declarado; node:http em scripts/serve.mjs:1–3,135. Não há Fastify/Express nem API de negócio.'),('Persistência e auth','Nenhum banco, ORM/query builder, RLS, middleware de tenant, sessão autenticada ou JWT. localStorage guarda preferências; sessionStorage guarda marcadores locais.'),('Deploy','Procfile:1; GitHub Actions ci.yml e deploy.yml; buildpacks/Easypanel e alternativa Cloudflare Pages documentados. Sem Dockerfile, compose, Helm ou Terraform no checkout.')],[120,360])
p('Handler único: scripts/serve.mjs:74–129, registrado em :135. Cobertura integral dos ramos abaixo; rotas React não foram contadas como APIs.')
table(['Ramo / linhas','Verificação'],[('75–79','Métodos diferentes de GET/HEAD recebem 405; nenhuma escrita é executada.'),('49–71; 83–101','URL decodificada, caminho resolvido dentro de dist; escape lexical recebe 400; URL inválida e recurso ausente recebem 404.'),('103–119','MIME por extensão, nosniff e ETag; correspondência de ETag gera 304 sem corpo.'),('121–128','GET transmite arquivo; HEAD encerra sem corpo. Conteúdo da query não é interpolado em HTML.'),('src/app/App.tsx:56–63','Rotas /, /privacy, /terms, /projects, /services e * são públicas; sem gate de papel a cruzar com endpoint.')],[140,340])
p('Nove testes HTTP locais passaram: GET/HEAD /; POST /links, PATCH e DELETE; asset ausente; travessia codificada; percent-encoding inválido; payload HTML em query sem reflexão. Os detalhes estão em http-checks.json. Não houve tráfego de teste à produção.')
page();h('Pontos fortes — evidências verificadas')
strengths=[
('scripts/serve.mjs:51–56','const isInsideDist = requestedFile === distDirectory || requestedFile.startsWith(`${distDirectory}${sep}`);','Bloqueia o escape lexical do diretório publicado; teste codificado retornou 400. Não é uma garantia contra symlinks criados por um operador no dist.'),
('scripts/serve.mjs:75–78','if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405, { Allow: "GET, HEAD" });','A superfície atual não oferece escrita HTTP.'),
('src/pages/ProjectsPage.tsx:116–126','<h2 ...>{project.title}</h2>\n<p ...>{project.description}</p>','Texto via JSX; não há injeção de HTML bruto neste fluxo.'),
('src/lib/tracking.ts:48–50,70','`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`','Script com origem fixa e ID codificado. Meta usa URL fixa. O visitante não controla a URL do script.'),
('.github/workflows/deploy.yml:22–23; ci.yml:67','EASYPANEL_DEPLOY_WEBHOOK_URL: ${{ secrets.EASYPANEL_DEPLOY_WEBHOOK_URL }}\ntoken: ${{ secrets.CODECOV_TOKEN }}','Credenciais referenciadas pelo cofre de Actions; nenhum valor real encontrado nessas linhas.'),
('src/lib/pageMetadata.ts:13,19,25','existingTag.content = content;\nmetaTag.content = content;\ndocument.title = title;','Metadados atribuídos como propriedades, sem parsing de HTML.')]
for path,code,why in strengths:
 p(path,'SmallAudit');p(code,'CodeAudit');p(why)
p('Outros controles observados: consentimento de monitoring antes da inicialização (monitoring.ts:24–36; telemetry.ts:48–69), PII padrão desativada (monitoring.ts:45), consentimento validado como booleanos (privacyConsent.ts:37–50). Não foi feita certificação jurídica nem auditoria completa de privacidade.')
page();h('Achados detalhados por categoria')
p('Nenhuma vulnerabilidade verificável foi identificada. Não existem linhas de achado ou chips de severidade a preencher; a tabela registra o resultado por categoria sem criar falsos positivos.')
table(['Severidade','Arquivo:linha','Descrição'],[
('— / N/A','package.json; src/data/projects.ts:15–71','Isolamento: dados estáticos públicos, sem dono/tenant ou consultas.'),
('— / N/A','src/app/App.tsx:56–63; scripts/serve.mjs:75–79','Permissões: sem papel de usuário e sem ação privilegiada.'),
('— / N/A','scripts/serve.mjs:49–71,74–129','IDOR: todos os handlers (1/1) lidos; nenhum objeto privado endereçado por ID.'),
('— / sem achado','.env.example:1–8; .github/workflows/deploy.yml:22–23','Segredos: configurações públicas/vazias e referências ao cofre. Não há default de senha ou segredo a rejeitar no startup.'),
('— / sem achado','src/pages/ProjectsPage.tsx:73,134,239; src/data/projects.ts:20,33,39,43,65,69','URLs são constantes HTTPS ou caminhos locais; sem origem em input do visitante.'),
('— / sem achado','src/pages/PrivacyPage.tsx:58,83–84','Contato vem da configuração de build, prefixado por mailto: e renderizado como texto JSX.'),
('— / sem achado','src/lib/liquidGlass.ts:31–49,74–80; components/effects/LiquidGlassNavigation.tsx:7,39–42','Seletor de efeito é constante; outerHTML em liquid-gl é leitura para assinatura, não escrita de HTML.')],[78,175,227])
p('XSS: não há dangerouslySetInnerHTML, innerHTML de escrita, document.write, eval ou new Function no código próprio, nem renderizador Markdown/HTML. Nenhuma biblioteca de sanitização foi encontrada no manifesto/lockfile. Sem um sink de HTML não confiável, essa ausência não constitui falha. O backend entrega arquivos e não renderiza templates de e-mail.')
p('Pontos fracos / riscos centrais: nenhum risco explorável confirmado dentro do escopo. A visibilidade é limitada ao repositório e ao build local; coletor OTLP, conta Sentry, hospedagem, configurações privadas e sites externos não foram auditados. Não foram promovidas lacunas de observabilidade a vulnerabilidades.')
page();h('Histórico, bundle e validação')
p(f'Histórico: {scan["commits"]} commits alcançáveis por refs locais; clone não shallow; {scan["text_blobs"]} blobs textuais únicos. Busca por chaves privadas, tokens de provedores, JWT, URLs com credenciais, atribuições de segredo e defaults de shell, complementada por revisão de linhas com palavras-chave. Sem validação de credenciais contra terceiros.')
p('Seis candidatos de defaults foram descartados: ${VPS_PORT:-22} em uma versão de deploy.yml e ${PORT:-3000} em cinco versões de package.json. São portas públicas, não segredos. Exemplos BOT_TOKEN, YOUR_PUBLIC_KEY e YOUR_GLITCHTIP_DSN são placeholders, sem credencial operacional embutida.')
p('Limite do histórico: não houve fetch adicional; referências remotas não presentes, commits inalcançáveis, objetos removidos, logs de CI e conteúdo de cofres não entram nessa conclusão. Uma busca por padrões não prova ausência absoluta de todo segredo possível.')
p(f'Bundle: {len(scan["bundle"])} arquivos textuais em dist reconstruídos por npm run validate; nomes e SHA-256 em scan-results.json. Nenhum candidato a segredo nessas saídas. O build local não continha a configuração opcional de telemetria; o código-fonte condicionado foi lido separadamente. O bundle publicado não foi coletado.')
table(['Verificação','Resultado'],[('npm run validate','Passou: ESLint/Biome, arquitetura, dead code, npm audit de dependências de produção, Vitest e build.'),('Testes existentes','7 arquivos / 15 testes aprovados. Cobertura publicada de linhas: 95,08% no subconjunto configurado, não em toda a aplicação.'),('npm audit --omit=dev','0 vulnerabilidades reportadas nessa execução. Esse número não substitui análise de autorização ou XSS.'),('HTTP local','9/9 verificações passaram; resultados em http-checks.json.'),('Mutação e E2E','Não executados nesta auditoria. Não houve alteração de lógica de negócio; validate não inclui Playwright.'),('PDF','A4, margens de 20 mm, cabeçalho/rodapé, gráficos e rasterização por página; ver pdf-verification.json e previews/.')],[135,345])
h('Recomendações priorizadas')
p('P1 — Antes de introduzir dados privados: definir identidade, dono/tenant e autorização no servidor; testar acesso cruzado em cada operação. Recomendação futura, não correção de falha atual.')
p('P2 — Antes de publicar nova configuração: examinar os VITE_* e o bundle exato destinado à produção; manter tokens privados no servidor/cofre. Não há vazamento confirmado a rotacionar.')
p('P3 — Repetir esta revisão quando houver API, CMS, URLs editáveis ou renderização de HTML/Markdown. Acrescentar testes de fonte→sink e de posse às novas funcionalidades.')
page();h('Cobertura arquivo por arquivo')
p('Inventário completo com linhas e hashes: inventory.json. Todos os arquivos textuais rastreados foram incluídos na busca de segredos; a revisão manual de fluxos cobriu os grupos abaixo. Não se afirma revisão linha a linha de bibliotecas de terceiros inteiras.')
table(['Arquivos / linhas','Cobertura e conclusão'],[
('scripts/serve.mjs:1–137','Único handler e todas as funções auxiliares: sem persistência, escrita ou HTML interpolado.'),
('src/app/App.tsx:1–79; routes/routes.ts:1–13; main.tsx:1–30','Inventário completo de rotas, inicialização e ausência de auth/gates de papel.'),
('src/pages/HomePage.tsx; NotFoundPage.tsx; TermsPage.tsx; ServicesPage.tsx (integrais)','Páginas públicas com JSX e rotas constantes; serviços são apenas anúncios.'),
('src/pages/ProjectsPage.tsx:1–317; data/projects.ts:1–71','Origem de texto/URLs, imagens, href e callbacks rastreados.'),
('src/pages/PrivacyPage.tsx:1–110','Contato de build e conteúdo estático; não é uma interface administrativa.'),
('src/components/ (todos os arquivos TSX)','Button, ProfilePhoto, PageContainer, feedback, consentimento e navegação: sem sink próprio de HTML bruto.'),
('src/lib/ (todos os arquivos TS)','Monitoring, tracking, telemetry, privacyConsent, metadata, release, chunkRecovery e liquidGlass: fontes, scripts e uso de storage revisados.'),
('build/; scripts/check-bundle.mjs; vite.config.ts','Release serializado com JSON.stringify; orçamento de bundle e testes de hospedagem; sem segredo hardcoded.'),
('.github/; Procfile; public/_headers; .env.example; .gitignore','CI, deploy e configuração atual; ausência de arquivos Docker/Helm/Terraform inventariada.'),
('README.md; docs/monitoring.md; docs/superpowers/plans/2026-05-03-sentry-monitoring.md','Documentação e exemplos de credenciais revisados; placeholders não tratados como vazamento.'),
('package*.json; configs; e2e/; testes; public/; index.html','Manifestos, lock, arquivos de build, testes e ativos textuais incluídos nas buscas; inventário fornece extensão exata.')],[210,270])
page();h('ISSUES PARA O GITHUB')
p('Não há achados acionáveis confirmados nas cinco categorias. Portanto, não foram geradas issues de vulnerabilidade nem blocos fictícios de falha. As recomendações preventivas da página anterior não são achados e não foram convertidas em tickets de segurança.')
p('A issue operacional #22 registra a produção deste relatório; ela não representa vulnerabilidade. Nenhuma correção de aplicação foi feita nesta auditoria.')
p('Quando uma nova auditoria confirmar uma falha, o bloco de issue deverá conter título [Segurança], labels, descrição e explorabilidade, arquivo:linha e trecho, impacto, correção e checklist verificável. Esta edição mantém a seção final vazia de tickets para evitar spam e acusações sem evidência.')
p('Referência operacional: https://github.com/danilomoreiraai/levelUpUser/issues/22')
def footer(c,doc):
 c.setStrokeColor(colors.HexColor('#CBD5E1'));c.line(56.7,795,538.5,795)
 c.setFont('Audit',8);c.setFillColor(colors.HexColor('#64748B'));c.drawString(56.7,808,'Auditoria de Segurança — LevelUp User');c.drawString(56.7,30,'21/09/2026 • Revisão '+scan['commit'][:7]);c.drawRightString(538.5,30,f'Página {doc.page}')
pdf=D/'relatorio-seguranca-levelup-user.pdf'
doc=SimpleDocTemplate(str(pdf),pagesize=A4,rightMargin=56.7,leftMargin=56.7,topMargin=64,bottomMargin=56.7,title='Relatório de Auditoria de Segurança — LevelUp User',author='Auditoria de código')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
(D/'report.md').write_text('\n'.join(markdown))
preview=D/'previews';preview.mkdir(exist_ok=True)
check=[]
with fitz.open(pdf) as f:
 for i,page in enumerate(f):
  page.get_pixmap(matrix=fitz.Matrix(1.15,1.15)).save(preview/f'page-{i+1:02}.png')
  check.append({'page':i+1,'width':page.rect.width,'height':page.rect.height,'text_characters':len(page.get_text()),'images':len(page.get_images())})
(D/'pdf-verification.json').write_text(json.dumps({'pages':len(check),'page_details':check},indent=2))
print(f'{pdf}: {len(check)} páginas')
