---
name: Bug report
about: Something in the starter, a template, or a package is broken
title: '[bug] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what went wrong.

**Which package / area?**
- [ ] `create-wakii-stack` — full platform scaffold (services / compose / gateway)
- [ ] `create-wakii-app` — FE starter
- [ ] `@wakii/ui-kit` — design system
- [ ] Boilerplate repo itself — contracts, a service, docs, CI

**Steps to reproduce**
1. Run `...`
2. Open `...`
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened (error message, wrong output, hang…).

**`pnpm verify:quick --json` output**
Paste the real JSON output and the exit code. Do not paraphrase it as "PASS".

```
[paste output here]
```

**Environment**

```
node --version && pnpm --version
docker version --format '{{.Server.Version}}'
docker compose version
```

- OS: [e.g. macOS 15, Ubuntu 22.04, Windows 11 + WSL2]
- Run mode: [A — docker compose / B — native services]
- If a service is involved, relevant logs (`docker compose logs <svc>`):

```
[paste logs here]
```

**Additional context**
Screenshots, contract diffs, or links to related issues.
