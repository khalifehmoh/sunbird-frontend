# Specs and blueprints

## Source of truth

| Format | Role |
|--------|------|
| **DOCX** | SA authoring and stakeholder review |
| **Markdown** (`docs/*.md`) | Engineering + Cursor source of truth |

Canonical admin blueprint: [`admin.md`](./admin.md) (latest upload).  
Older filename `admin_blueprint_v3.md` is superseded — do not point Cursor rules at it.

## Adding a new module doc

1. Convert the SA DOCX to Markdown.
2. Save as `docs/<module>.md` (stable name; no `_v4` suffixes — use git history).
3. Add a row to the catalog below.
4. Update `.cursor/rules/project-blueprint.mdc` (index entry).
5. Optionally add a scoped rule with `globs` for that module’s code paths.

## Catalog

| Module | Markdown | Notes |
|--------|----------|--------|
| Admin | [`admin.md`](./admin.md) | Product/API/UI scope for the admin module |
| Permissions (backend 403) | [`../../sunbird-core-backend-nestjs/docs/permissions-followup.md`](../../sunbird-core-backend-nestjs/docs/permissions-followup.md) | Frontend session/nav gating is done. Resume API guards from that note — DB `permission_code` is source of truth (`USER_MGMT_READ`, not blueprint `USER:READ`). |

## Day-to-day (Cursor)

1. Cite the file and section: `@docs/admin.md §7.1`.
2. Implement only that section’s scope; if code and blueprint disagree on **product** behavior, stop and ask.
3. **Backend stack:** blueprints may say Java / Spring Boot. Implement in **NestJS + TypeORM** (see NestJS repo rule `nestjs-stack.mdc`). Do not generate Java.

## Example prompt

```text
Implement Admin User List API per @docs/admin.md §7.1 in NestJS.
Ignore Spring/JPA examples; follow existing NestJS auth/tenant patterns.
Match routes, permissions, and response fields from that section only.
```
