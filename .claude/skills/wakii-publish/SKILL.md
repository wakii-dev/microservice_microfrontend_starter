---
name: wakii-publish
description: Use when releasing/bumping/publishing a wakii npm package (@wakii/ui-kit, create-wakii-app, create-wakii-stack) — "publish a new version", "bump version", "release ui-kit". Follows docs/WORKFLOW.md §4 + app/ui-kit/RELEASE.md. Do NOT use for releases that are not npm packages, or internal-only bumps not yet published.
---

# wakii-publish — npm release with checkpoints

## Overview

The docs/WORKFLOW.md §4 flow as directives. Publishing = outward action — every checkpoint has a gate; STOP at steps needing the user's auth/token, never bypass.

> **Scope guard (R5 onboarding 2026-10-28):** publishable packages (`@wakii/ui-kit`, `create-wakii-app`, `create-wakii-stack`) live ONLY in the UPSTREAM repo (which has `app/ui-kit/` + `app/<pkg>/scripts/publish-npm.sh`). A project scaffolded by `create-wakii-stack` contains NONE — every `package.json` is `private:true`. IF running in a scaffolded copy THEN STOP: this skill does not apply there; tell the user this skill is upstream-only.

## Directives

1. IF starting THEN `git fetch origin && git pull` — publish ONLY from the freshest main (stale main once overwrote a version — create-wakii-stack 0.1.9).
2. IF bumping THEN the version + a `CHANGELOG.md` entry in the same commit; BREAKING → major (for 0.x: minor); NEVER change an already-published version.
3. THEN self-check the tarball: `npm pack` + `tar -tzf` — all CSS/tokens/assets/templates present, `+x` bits correct (hand-rolled tarball copies once lost the CSS tokens — visible only to consumers).
4. IF the tarball is missing files THEN fix the publish script + its survival-file guard FIRST — never publish incomplete.
5. THEN publish via the existing script: `bash app/<pkg>/scripts/publish-npm.sh` (builds + guards + `--access public`) — NEVER bare `npm publish`.
6. THEN WAIT 2–5 minutes for propagation → verify from the registry: `npm view <pkg> versions` + dist-tags; starter packages: try `npx <pkg>@latest` outside the repo. Do NOT re-publish thinking it failed.
7. IF the new version is still missing after 10 minutes THEN `npm whoami` + read the script logs — fix, then bump a NEW version (a taken version is taken forever).
8. THEN log `docs/team/TEAM.md` + report the real result with evidence (`npm view` / npx output).

## Mirror registry

- IF the org needs an internal mirror THEN GitHub Packages (`@wakii-dev/*`, `npm.pkg.github.com`) — npmjs stays canonical; two-registry checklist: `app/ui-kit/RELEASE.md`.
