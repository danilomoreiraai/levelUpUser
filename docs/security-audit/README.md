# Auditoria de segurança — LevelUp User

Retrato do commit `5bae431deae12e590f22cc74b2f90c271650d1d5`, em 21/09/2026.
Resultado: zero vulnerabilidades confirmadas nas cinco categorias solicitadas.
O relatório descreve limites e categorias não aplicáveis; não certifica produção.

## Regerar o PDF

Python 3.12, sem instalação global:

```sh
python3 -m venv /tmp/levelup-audit-venv
/tmp/levelup-audit-venv/bin/pip install -r docs/security-audit/requirements.txt
/tmp/levelup-audit-venv/bin/python docs/security-audit/generate_report.py
```

O gerador usa os resultados registrados e o texto da revisão-base. Ele não faz
uma nova auditoria automaticamente. Para outro commit, revise o conteúdo, as
linhas e as contagens antes de publicar outro relatório.

## Repetir as verificações auxiliares

```sh
npm run validate
python3 docs/security-audit/scan_secrets.py
python3 docs/security-audit/check_http.py
```

`AUDIT_GIT` e `AUDIT_NODE` permitem selecionar executáveis alternativos. O scanner
usa refs locais, não faz fetch e não testa credenciais contra provedores. Ele
substitui `scan-results.json`; execute-o somente após concluir o build. O teste
HTTP inicia o servidor em localhost:43197, usa o dist existente e o encerra no
final. Ele substitui `http-checks.json`. Os resultados novos precisam de revisão
humana; não são suficientes para atualizar as conclusões automaticamente.

## Arquivos entregues

- `relatorio-seguranca-levelup-user.pdf`: relatório final em A4.
- `report.md`: conteúdo textual extraído da estrutura do gerador.
- `generate_report.py`: gerador do PDF, gráficos e previews.
- `requirements.txt`: dependências isoladas do gerador.
- `scan_secrets.py`: scanner auxiliar do histórico e bundle, com candidatos sem valores.
- `scan-results.json`: escopo, candidatos descartados e hashes do bundle.
- `check_http.py`: verificações locais não destrutivas do handler estático.
- `http-checks.json`: resultados dos nove casos HTTP.
- `inventory.json`: arquivos rastreados na revisão-base, linhas e SHA-256.
- `validation.txt`: saída de `npm run validate` na revisão-base.
- `charts.png`: gráficos do resumo executivo.
- `pdf-verification.json`: páginas, dimensões e extração textual do PDF.
- `previews/page-NN.png`: rasterização de cada página para inspeção visual.
- `README.md`: este índice e instruções de reprodução.

Issue operacional: https://github.com/danilomoreiraai/levelUpUser/issues/22.
Não há issue de vulnerabilidade a copiar nesta edição porque não houve achado
acionável confirmado. As recomendações são preventivas.
