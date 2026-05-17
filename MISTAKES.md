# Mistakes

- 2026-05-17: CupMargin visual simplification left the detailed `#calculator` direct-input section hidden on `/calculator`; route-specific QA must assert key feature text/inputs are visible, not only hero/result markers.
- 2026-05-17: CupMargin Vercel deploy was reported from a direct local-source deploy while the Git `main` commit still lacked the changes; for Vercel/Git-linked projects, commit and push first or explicitly report that production is ahead of Git.
