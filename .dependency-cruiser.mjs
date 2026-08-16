export default {
  extends: "dependency-cruiser/configs/recommended",
  forbidden: [
    {
      name: "pages-are-entry-points",
      comment: "Reusable application layers must not import route-level page components.",
      severity: "error",
      from: { path: "^src/(components|data|lib|routes)/" },
      to: { path: "^src/pages/" },
    },
    {
      name: "lib-is-framework-independent",
      comment: "Library modules must not depend on React components or route pages.",
      severity: "error",
      from: { path: "^src/lib/" },
      to: { path: "^src/(components|pages)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: "^src/test/|\\.(test|spec)\\.(ts|tsx)$",
    tsPreCompilationDeps: true,
  },
};
