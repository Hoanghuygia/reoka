# Agent docs: start here

Written for coding agents, not people. Terse on purpose. Read this file, then only the files your task needs.

## Trust order

Code > migrations > these docs > root and backend READMEs > design mockups.

If a doc disagrees with the code, trust the code and fix the doc in the same change. If a mockup disagrees with a rule in `AGENTS.md`, the rule wins: raise it with the user.

## Files

| File | Holds |
|---|---|
| `status.md` | What is built, what is not, next steps, open questions. **Read first for any task.** |
| `architecture.md` | System map, module dependencies, request flow, code patterns |
| `domain.md` | Glossary, entities and relations, current vs target schema, permissions |
| `decisions.md` | Why things are the way they are, what was rejected, who confirmed it |
| `screens.md` | Template D screens mapped to APIs and data, plus conflicts with the design |
| `zalo.md` | Zalo API facts with a confidence level for each |
| `recipes.md` | Step-by-step for common changes, definition of done, known gotchas |

Rules, commands and security invariants live in `/AGENTS.md`. Do not copy them here.

## Routing: requirement → read

| Requirement touches | Read | Then open |
|---|---|---|
| New backend endpoint | `status`, `architecture`, `recipes` | `backend-reoka/src/http/app.rs`, the owning module |
| Database or data model | `domain`, `recipes` | `backend-reoka/migrations/` |
| Clinic features or access | `domain`, `decisions` | `AGENTS.md` security invariants; check the open questions in `status` first |
| Medical records, vaccinations | `domain`, `screens`, `architecture` (cross-module transactions) | `backend-reoka/src/pet/mod.rs` as the pattern |
| Reminders, ZNS | `domain`, `zalo`, `architecture` | `backend-reoka/README.md` Reminders section |
| Login, sessions, phone number | `zalo`, `architecture` | `backend-reoka/src/identity/`, `backend-reoka/src/zalo/mod.rs` |
| Mini App screen | `screens`, `status` | `design/ui/template-d-ket-hop.html`, `mini-app-reoka/src/` |
| Connecting Mini App to the API | `status`, `zalo`, `architecture` | `backend-reoka/src/http/app.rs` |
| Public QR page | `domain`, `decisions` | `AGENTS.md` security invariants |
| B2B web app | `decisions`, `architecture`, `domain` | Nothing exists yet |
| Branding or visual assets | None | `design/README.md` |
| "Why is it like this?" | `decisions` | |

## Before coding

1. Check `status.md` for an open question that blocks the task. If one does, ask the user instead of choosing silently.
2. Check `decisions.md` before proposing a different approach. Reopen a decision only with a new reason.
3. Check `screens.md` conflicts if the task is driven by a mockup.

## Keeping these docs useful

Update in the same change as the code:

- `status.md`: when something gets built or a question gets answered. Delete finished items; git has the history.
- `domain.md`: when a migration lands. Move the entity from target to current.
- `decisions.md`: when a choice is made or reversed. Record who decided.
- `zalo.md`: when a fact gets verified or disproved against real Zalo.

Writing rules: one home per fact, and link instead of copying. Refer to symbols and files, not line numbers. Mark unverified claims. Add no history, narration or anything derivable with a quick grep. Docs are in English.
