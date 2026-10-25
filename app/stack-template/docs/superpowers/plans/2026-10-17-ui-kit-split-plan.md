# Plan: ui-kit split + Storybook Phase 1

Spec: `docs/superpowers/specs/2026-10-17-ui-kit-split.md` · Nhánh: `__STACK_ORG__/ui-kit-split` · 2026-10-17

| # | Task | Exit criteria |
|---|------|---------------|
| T1 | Spec + plan (docs này) | Được duyệt trong chat, committed |
| T2 | `app/ui-kit`: git mv `src/ui` + `src/styles` từ shared; package.json (qua source, exports `.` + `./styles/*.css`); src/index.ts barrel; env.d.ts; tsconfig; vitest.config + tests/setup; **move** `primitives.test.tsx` từ shell/tests; README | `pnpm --filter @wakii/ui-kit test && typecheck` PASS |
| T3 | `app/shared` slim: package.json bỏ exports `./ui` + `./styles/*`; index.ts bỏ re-export ui; README rewrite (logic-only, pointer ui-kit); 4 file logic KHÔNG đụng (READ-LOCKED) | shared typecheck đứng yên OK; không còn `src/ui` |
| T4 | Consumers đổi imports: shell (bootstrap css, RemoteSlot Skeleton, pages nếu có, tests, package.json +dep), remote-tasks (TasksPage EmptyState/Skeleton + tokens.css, TaskItem Spinner, standalone.tsx, api.test? chỉ UI imports, package.json), remote-activity (tương tự) | grep `fe-shared` còn đúng logic-only; suites shell 43/tasks 36/activity 22 PASS; typecheck + build ×3 OK |
| T5 | `pnpm install` (lockfile: importer ui-kit + deps consumers) → frozen PASS sau đó | install --frozen-lockfile PASS |
| T6 | Dockerfiles ×3: COPY app/ui-kit (package.json trước, full sau) | `docker compose build shell tasks activity` PASS |
| T7 | convergence copy-dir: typecheck standalone fe-shared + ui-kit (mini workspace catalog + @types/react + --jsx) | local repro EXIT=0 cả hai |
| T8 | CI `ui-kit.yml`: typecheck + test + build-storybook, paths `app/ui-kit/**` | workflow yaml parse + chạy xanh trên push |
| T9 | Storybook: `.storybook/{main,preview}.ts` (react-vite + addon-docs, preview import tokens+base); stories: Badge 9 variants, EmptyState/Skeleton/Spinner states, Tokens docs page; script `build-storybook` | `pnpm --filter @wakii/ui-kit build-storybook` PASS; dev screenshot evidence |
| T10 | ADR-0009 + sync descriptor: CLAUDE.md (READ-LOCKED + docs map + CI bảng), orca.yaml (frontend.shared/ui-kit), agents/fe-dev, scaffold SCAFFOLD.md, README root | descriptor khớp thực tế; review pass |

Thứ tự: T2→T3→T4→T5 (core, verify mỗi bước) → T6/T7/T8 (infra) → T9 (storybook) → T10 (docs). Merge main sau khi toàn bộ xanh + CI收敛.
