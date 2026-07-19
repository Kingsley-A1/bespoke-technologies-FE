# Invoice Prototype Extraction Map

| Prototype area | Root disposition | Reason |
|---|---|---|
| `src/types/invoice.ts` | Adapt into `src/features/admin/types.ts` | Keep billing types beside the wider admin domain. |
| `src/lib/invoice-math.ts` | Port and strengthen | Proven calculations; persistent authority uses decimal strings/minor-unit-safe conversion. |
| `src/lib/invoice-number.ts` | Replace allocation, preserve prefixes | Database transaction owns sequences; BT-INV, BT-PRO, and BT-REC remain. |
| `src/lib/invoice-pdf.ts` | Port into `src/features/admin/billing/pdf.ts` | Preserve approved A4 document and Unicode currency support. |
| `src/lib/auth.ts` | Replace | Single password account and demo bypass do not meet named-user RBAC requirements. |
| `src/lib/repository.ts` | Replace | Split Supabase/in-memory adapter and JSON payload table do not meet the root data boundary. |
| Invoice editor/document components | Adapt | Preserve the successful editor and preview workflow within `/admin/billing`. |
| Dashboard shell/sidebar/header | Adapt to the root design system | Visual source of truth for admin density and hierarchy. |
| `db/schema.sql` | Superseded by root migrations | CockroachDB becomes the single operational store. |
| Prototype QA images and PDF | Retain as reference evidence | Used for visual and PDF regression checks. |
| Nested package/deployment config | Do not deploy | The root repository is the only application target. |

