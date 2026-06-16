# BetterReviews — working notes for Claude

Photo-first local recommendation app. npm-workspaces monorepo:
`apps/server` (Express + pg + Zod), `apps/web` (Vite + React), `packages/shared`
(types + the isolated v0 match-score). See `README.md` for setup and the two
local workflows (plain Docker Postgres + mock auth, or local Supabase + magic
link). GitHub: `JustinLeung/BetterReviews`, default branch `main`.

Before committing, always run from the repo root:

```bash
npm run typecheck     # all workspaces
npm run build         # shared → server → web
```

---

## Git & commit practices

- **Never commit directly to `main`.** Branch first:
  `git switch -c <type>/<short-desc>` where `<type>` ∈
  `feat | fix | chore | refactor | docs | test`
  (e.g. `feat/supabase-magic-link`, `fix/save-button-401`).
- **Don't commit a broken tree.** `npm run typecheck` and `npm run build` must
  pass first. Don't commit generated output (`dist/`, `node_modules/`).
- **Atomic, focused commits.** One logical change per commit. Don't mix
  refactors with behavior changes or unrelated fixes.
- **Message style.** Imperative subject ≤ ~72 chars, no trailing period
  (`Add magic-link auth`, not `Added…`). Add a body explaining the *why* when
  it isn't obvious. Reference issues (`Refs #123`, `Closes #123`).
- **Never commit secrets.** Only `*.env.example` files are tracked; all real
  `.env` / `.env.local` are git-ignored — keep it that way. Values placed in
  `.env.example` must be non-secret (e.g. the public local Supabase demo keys),
  never real project credentials.
- **AI-assisted commits** include a co-author trailer:
  `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Don't `git add -A` blindly — review `git status` / `git diff --staged` and
  stage intentionally. Don't rewrite history (`--force`) on `main` or any shared
  branch; prefer `--force-with-lease` on your own feature branch only.

## Pull request practices

- **All changes land via PR**, even small ones — `main` stays
  green and reviewable. Push the branch and open a PR with the `gh` CLI.
- **Keep PRs small and single-purpose.** Easier to review, faster to merge,
  safer to revert. Split large work into stacked/sequential PRs.
- **Title**: imperative and scoped (`feat(server): verify Supabase JWTs`).
  **Body**: what changed and why, how to test/verify, and screenshots or a clip
  for any UI change. Note any follow-ups or known gaps.
- **Self-review the diff first.** Remove debug logging, stray TODOs, and
  commented-out code. Confirm typecheck + build pass locally; keep CI green.
- Open as a **draft** while WIP; mark ready and request review when it's
  complete. Address review comments with follow-up commits (don't force-push
  while a review is in progress).
- **Merge**: prefer **squash merge** for a clean, linear history on `main`;
  ensure the squash commit message is meaningful. **Delete the branch** after
  merge.

```bash
git switch -c feat/<short-desc>
# …work, then verify…
npm run typecheck && npm run build
git commit -m "feat: <imperative summary>"
git push -u origin HEAD
gh pr create --fill --base main        # add --draft while WIP
```
