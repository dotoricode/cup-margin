# CupMargin measurement artifacts

## Directory policy

- `raw/`: checked evidence JSON from manual or scripted audits.
- `lhci/<formFactor>/`: generated LHCI filesystem output from `npm run lhci:mobile` and `npm run lhci:desktop`.
- `measurement-baseline.json`: compact baseline manifest used to understand why `lighthouserc.cjs` thresholds are set where they are.

## Current baseline source

- Landing mobile guardrail: `raw/lighthouse-landing-mobile.json`.
- Calculator mobile guardrail: `raw/lighthouse-calculator-mobile.json`.
- Calculator desktop guardrail: `raw/lighthouse-calculator-desktop.json`.
- `raw/lighthouse-landing-mobile-default.json` is retained as legacy evidence only because it is materially worse than the current landing capture.

## Running checks

```bash
npm run lhci:mobile
npm run lhci:desktop
npm run a11y
```

The LHCI wrapper sets a dedicated Chrome user data directory and retries cleanup so Windows `EPERM` temp-file failures do not break otherwise valid runs.
