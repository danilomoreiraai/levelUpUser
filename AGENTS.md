# Repository Agent Instructions

These instructions apply to every human or automated contributor working in
this repository, regardless of model, client, or IDE.

## Required GitHub workflow

1. Create or identify a GitHub issue before changing code. The issue must state
   the problem, intended scope, and verifiable acceptance criteria.
2. Never implement deployable work directly on `main`. Use a focused branch
   named `agent/<description>`, `feat/<description>`, `fix/<description>`, or
   `chore/<description>`.
3. Keep commits intentional and use Conventional Commit messages.
4. Deliver changes through a pull request. Every PR description must link its
   issue with `Closes #<number>`, `Fixes #<number>`, or `Refs #<number>`.
5. Include impact, privacy/security considerations, validation evidence, and a
   rollback plan in the PR description.
6. Production deployment is allowed only from `main` after required CI checks
   pass and the PR is merged. Never trigger a production deployment from a
   feature branch.

## Engineering quality gates

- Preserve strict TypeScript and named exports.
- Keep components accessible, responsive, and compatible with
  `prefers-reduced-motion`.
- Deferred UI must provide loading, error, empty, progress, and skeleton states
  when those states can occur. Lazy-load routes and non-critical media.
- Optional analytics, marketing, monitoring, and tracing must remain disabled
  until the user grants the matching consent category.
- Never hardcode secrets, DSNs, tracking IDs, endpoints, or environment-specific
  values. Use `import.meta.env` and document variables in `.env.example`.
- Add or update unit/integration tests for behavior changes and Playwright tests
  for critical user journeys.
- Run `npm run validate` before requesting review. Run mutation tests when
  changing business logic covered by unit tests.
- Do not weaken lint, architecture, coverage, privacy, or security rules merely
  to make CI pass.

## Pull request discipline

- Prefer small PRs with one coherent outcome. If issues are intentionally
  combined, list every issue and explain the dependency between them.
- PRs start as drafts until local validation succeeds.
- Do not mark a PR ready while required checks fail.
- Review generated dependency and lockfile changes; avoid unrelated churn.
- Record user-visible changes and operational migration steps in the PR.

## Privacy baseline

- Essential storage may run without opt-in only when strictly necessary.
- Analytics, marketing, and optional monitoring are opt-in.
- Rejecting optional processing must be as easy as accepting it.
- Users must be able to reopen preferences and revoke consent.
- Treat privacy copy as an operational baseline, not a substitute for qualified
  legal review in each jurisdiction.
