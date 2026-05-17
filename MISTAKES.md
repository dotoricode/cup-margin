# Mistakes

- 2026-05-17: CupMargin visual simplification left the detailed `#calculator` direct-input section hidden on `/calculator`; route-specific QA must assert key feature text/inputs are visible, not only hero/result markers.
- 2026-05-17: CupMargin Vercel deploy was reported from a direct local-source deploy while the Git `main` commit still lacked the changes; for Vercel/Git-linked projects, commit and push first or explicitly report that production is ahead of Git.
- 2026-05-17: CupMargin beta waitlist briefly stored submitted email in `localStorage`; lightweight mailto/waitlist flows must not persist PII client-side unless retention/consent is explicit.
- 2026-05-17: CupMargin CTA copy `이 메뉴 500원 올리면?` initially only scrolled/selected without forcing `priceDelta=500`; concrete numeric CTA copy must be backed by matching state changes.
- 2026-05-17: CupMargin shared save card initially advertised CSV in render paths without CSV handler; capability copy in shared components must be conditional on actual handlers/features.
- 2026-05-17: Lighthouse on Windows can emit EPERM while deleting temp profiles even after writing JSON; verify output files and parse scores before declaring the audit failed.
