# Data provenance

All data is synthetic. Source-of-truth is `src/data/sources.ts`.

## Companies (`src/data/companies.ts`)
8 hand-authored fictional mid-market companies spanning robotics, maritime logistics, plant-based CPG, medical devices, DTC apparel, edtech, payments, and climate SaaS. Designed to span the EOR-buyer ICP from "single-country, expanding" to "multi-entity, EOR-savvy."

## Signals (`src/data/signals.ts`)
9 hand-authored intent signals across HIRING_INTL, FUNDING, EXPANSION, EXEC_HIRE, COMPLIANCE. Source URLs use `example.invalid` per RFC 6761. Raw payloads modeled on plausible feed shapes (Greenhouse, TechCrunch RSS, LinkedIn, earnings transcripts) without ingesting any real data.

## ICP doc (`src/data/icp.ts`)
Synthetic EOR-buyer ICP doc reflecting publicly known EOR market segmentation patterns. Not a leaked or proprietary G-P document.

## Brand voice (`src/data/brand-voice.ts`)
Synthetic outbound brand-voice playbook modeled on enterprise compliance-led B2B tone. Forbidden phrase list (synergy, game-changing, rockstar, etc.) is conventional, not lifted.

## Battlecards (`src/data/battlecards.ts`)
Synthetic Deel / Remote / Rippling battlecards built from publicly available market positioning summaries. The brand-voice doc explicitly forbids naming competitors in cold outbound — the agent won't surface them in subject lines.

## Campaigns (`src/data/campaigns.ts`)
3 hand-authored synthetic ad campaigns with sparkline trend, CPL, ROI. The reallocation proposal is generated from the deterministic CPL deltas, not from a model call.

## Audit log seed (`src/data/audit-seed.ts`)
9 seeded audit entries for realism. Every approve/reject in the live UI appends a real entry.

## No real PII
- No real names, emails, or phone numbers.
- Source URLs use `example.invalid`.
- `'h.arkinstall@example.invalid'` is used as a synthetic approver name purely to make the audit log feel realistic; it does not ingest, store, or transmit anything.
