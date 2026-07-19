# Admin Design QA

## Sources

- Dashboard reference: `Bespoke_Invoice_Generator_Source/qa/dashboard-desktop.png`
- Invoice reference: `Bespoke_Invoice_Generator_Source/qa/pdf-render/demo-invoice.png`
- Approved brand asset: `Bespoke_Invoice_Generator_Source/public/brand/bespoke-technologies-logo.png`

## Evidence

- `qa/admin/dashboard-comparison.png` places the 1363 x 936 reference and implementation in one comparison image.
- `qa/admin/invoice-comparison.png` places the 1240 x 1754 reference and implementation in one comparison image.
- Desktop, tablet, mobile, mobile-navigation, billing-editor, billing-detail, and clean-invoice captures are stored in `qa/admin/`.
- `qa/admin/browser-qa.json` records the automated browser checks and capture metadata.

## Checks completed

- The implementation keeps the reference's white navigation rail, pale-blue workspace, blue primary actions, restrained cards, readable financial table, and status treatments.
- The wider admin remit is expressed through Sales, Clients, Projects, Billing, Inbox, Reports, and Settings without breaking the reference shell.
- The invoice preserves the accepted A4 structure, approved wordmark, document identity, parties, line items, totals, notes, footer, and page number.
- Desktop, tablet, and mobile layouts have no unintended horizontal overflow.
- Mobile navigation opens and exposes the primary routes.
- Login focus order, form labels, landmarks, duplicate IDs, interactive controls, and reduced-motion handling pass the Edge browser harness.
- The server-generated PDF regression confirms one A4 page with embedded brand and Unicode font assets.

final result: passed
