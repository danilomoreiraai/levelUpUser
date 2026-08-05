import { Link } from "react-router-dom";

import { routes } from "@/routes/routes";

const termsSections = [
  {
    title: "Uso do site",
    body: "O LevelUp User e um espaco pessoal para apresentar projetos em andamento, concluidos e futuros. Ao acessar o site, voce concorda em usa-lo de forma licita, sem tentar comprometer sua seguranca, disponibilidade ou integridade.",
  },
  {
    title: "Projetos apresentados",
    body: "Os projetos exibidos podem estar em diferentes fases de maturidade. Alguns podem ser demonstracoes, experimentos, prototipos ou ideias futuras, e podem mudar, ficar indisponiveis ou ser removidos sem aviso previo.",
  },
  {
    title: "Sem garantia de disponibilidade",
    body: "O site e os projetos sao disponibilizados como estao. Embora exista cuidado para manter as informacoes corretas e acessiveis, nao ha garantia de funcionamento continuo, ausencia de erros ou adequacao a uma finalidade especifica.",
  },
  {
    title: "Propriedade intelectual",
    body: "Textos, interfaces, codigo, marcas, imagens e demais materiais publicados pertencem aos seus respectivos titulares. Voce nao deve copiar, redistribuir ou reutilizar conteudo do site sem autorizacao, exceto quando uma licenca do proprio projeto permitir.",
  },
  {
    title: "Links externos",
    body: "Alguns projetos podem apontar para repositorios, demos, ferramentas ou sites de terceiros. Esses servicos possuem seus proprios termos e politicas, e o LevelUp User nao controla nem se responsabiliza pelo conteudo ou funcionamento deles.",
  },
  {
    title: "Limitacao de responsabilidade",
    body: "O LevelUp User nao se responsabiliza por perdas, danos, indisponibilidades, decisoes ou resultados decorrentes do uso do site, das demonstracoes ou das informacoes apresentadas, dentro dos limites permitidos pela lei aplicavel.",
  },
  {
    title: "Alteracoes nestes termos",
    body: "Estes termos podem ser atualizados para refletir mudancas no site, nos projetos ou em requisitos operacionais. A versao publicada nesta pagina sera a referencia vigente para o uso do LevelUp User.",
  },
  {
    title: "Contato",
    body: "Para duvidas sobre estes termos, solicitacoes sobre projetos ou pedidos relacionados ao uso de conteudo, entre em contato pelo canal oficial informado pelo responsavel do LevelUp User.",
  },
];

export function TermsPage() {
  return (
    <main className="min-h-dvh bg-surface-subtle px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          className="text-sm font-medium text-brand hover:text-brand-hover"
          to={routes.home}
        >
          Voltar para o inicio
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            Termos
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Termos de Servico
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Ultima atualizacao: 17 de maio de 2026. Estes termos explicam as
            condicoes de uso do LevelUp User, um site pessoal para apresentar e
            disponibilizar projetos em andamento, concluidos e futuros.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          {termsSections.map((section) => (
            <section
              className="rounded-lg border border-slate-200 bg-white p-5"
              key={section.title}
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-xs leading-5 text-slate-500">
          Esta pagina e um texto pratico de termos de uso para um site pessoal
          de portfolio e nao substitui aconselhamento juridico. Revise com um
          profissional antes de usar em contextos regulados, comerciais ou de
          maior risco.
        </p>
      </div>
    </main>
  );
}
