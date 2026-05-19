# Cup Margin

Cup Margin is a Korean cafe-owner tool for estimating per-menu profit and monthly store profit from practical cafe cost inputs. This context captures product-domain language and audit artifact terms used when evaluating and improving the service.

## Language

**Cafe Owner**:
A non-specialist cafe operator who needs pricing and margin decisions expressed in store-language rather than finance or SaaS jargon.
_Avoid_: generic user, SaaS customer

**Primary Cafe Owner Persona**:
The main evaluation lens for Cup Margin: a small cafe owner using a mid-range mobile phone in short store-counter sessions.
_Avoid_: generic small business persona

**Secondary Multi-Store Persona**:
A 1-3 store operator whose needs matter mainly for paid features such as comparison, exports, and store-level analysis.
_Avoid_: enterprise persona

**Menu Profit Calculation**:
An estimate of how much profit a menu item leaves after sale price, variable costs, allocated fixed costs, and expected monthly sales are considered.
_Avoid_: abstract calculator, financial model

**Actual Audit Report**:
An HTML report based on direct inspection, automated checks where available, and benchmark comparison, not merely a reusable prompt.
_Avoid_: prompt-only report, hypothetical audit

**Live Site Evidence**:
Findings captured from the deployed Cup Margin site that cafe owners actually see.
_Avoid_: local-only evidence

**Deep Benchmark Set**:
Five benchmark sites, one from each required category, inspected with the same persona rubric as Cup Margin.
_Avoid_: broad shallow benchmark list

**Heremes Agent Work Prompt**:
A follow-up implementation prompt that tells an external coding agent how to turn the audit findings into concrete Cup Margin improvements.
_Avoid_: generic task list, vague improvement brief

**First Improvement Pass**:
The initial implementation scope after the audit: all P0 backlog items, two or three P1 items, and P2 items as design notes only.
_Avoid_: full backlog implementation

**Linked Screenshot Report**:
An HTML audit report that stores screenshots as separate asset files and references them with relative links or thumbnails.
_Avoid_: base64-heavy single HTML report

## Relationships

- A **Cafe Owner** uses a **Menu Profit Calculation** to decide whether a menu price or cost structure needs adjustment.
- The **Primary Cafe Owner Persona** carries about 80% of audit priority; the **Secondary Multi-Store Persona** carries about 20%.
- An **Actual Audit Report** evaluates Cup Margin through the **Cafe Owner** lens and uses **Live Site Evidence** as its primary source.
- A **Deep Benchmark Set** keeps the comparison focused enough that recommendations remain implementation-ready.
- A **Heremes Agent Work Prompt** consumes the **Actual Audit Report** and translates the findings into a **First Improvement Pass**.
- A **Linked Screenshot Report** keeps **Live Site Evidence** easy for both humans and external agents to inspect.

## Example Dialogue

> **Dev:** "Should this be a benchmark prompt or an audit output?"
> **Domain expert:** "It should be an **Actual Audit Report**: inspect the live site, compare benchmarks, then provide a **Heremes Agent Work Prompt** for implementation."
>
> **Dev:** "Should multi-store comparison drive the first fixes?"
> **Domain expert:** "No. Weight the **Primary Cafe Owner Persona** at 80%, then use the **Secondary Multi-Store Persona** to shape paid-feature recommendations."
>
> **Dev:** "Can we score from local code?"
> **Domain expert:** "Use **Live Site Evidence** for scoring. Use local code only to explain likely causes and write a better **Heremes Agent Work Prompt**."
>
> **Dev:** "Should we compare seven sites broadly?"
> **Domain expert:** "No. Use a **Deep Benchmark Set** of five sites, one per category, so each comparison has evidence and a usable takeaway."
>
> **Dev:** "Should the implementation agent do the whole backlog?"
> **Domain expert:** "No. The **First Improvement Pass** should implement all P0 items, only the highest-impact P1 items, and keep P2 as design notes."
>
> **Dev:** "Should screenshots be embedded directly into the report?"
> **Domain expert:** "No. Use a **Linked Screenshot Report** with screenshots in an assets folder and relative links from the HTML."

## Flagged Ambiguities

- "Report" was ambiguous between a prompt template and a real inspection deliverable — resolved: this work targets an **Actual Audit Report**.
- Persona priority was ambiguous — resolved: evaluate with an 80/20 weighting toward the **Primary Cafe Owner Persona**.
- Evidence priority was ambiguous — resolved: score from **Live Site Evidence**, then use local code for implementation guidance.
- Benchmark depth was ambiguous — resolved: inspect five benchmark sites deeply instead of seven sites shallowly.
- Improvement scope was ambiguous — resolved: the first Heremes task should implement all P0, two or three P1 items, and leave P2 as notes.
- Report packaging was ambiguous — resolved: use a **Linked Screenshot Report** rather than embedding screenshots as base64.
