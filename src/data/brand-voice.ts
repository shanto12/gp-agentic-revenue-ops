import type { KnowledgeDoc } from '../lib/types'

export const brandVoiceDoc: KnowledgeDoc = {
  id: 'brand-voice-2026',
  title: 'Brand voice — outbound nurture (synthetic)',
  kind: 'brand-voice',
  source: 'Synthetic. Modelled on enterprise compliance-led B2B tone.',
  updatedAt: '2026-04-10',
  bodyMarkdown: `# Brand voice — outbound nurture

## Voice attributes
- **Confident, calm, evidence-led.** We do not hype. We cite.
- **Audit-grade.** Every claim must be source-able.
- **Operator-grade.** Speak to RevOps, HR, and Legal as peers, not prospects to be persuaded.

## Always do
- Open with the specific public signal that triggered the outreach.
- Quantify when possible (countries, days saved, $ exposure).
- Include one line referencing how compliance risk grows non-linearly with country count.
- End with a soft, non-pushy CTA: a 20-minute compliance review, or a curated checklist.

## Never do
- Do not mention competitors by name in cold outbound.
- Do not say "world's leading" or "best-in-class" — substantiate or omit.
- Do not promise pricing in writing without a quote tool reference.
- Do not impersonate the prospect's industry insider tone.

## Forbidden phrases (auto-flag list)
- "synergy"
- "game-changing"
- "revolutionary"
- "ninja", "rockstar"
- "limited time"
- "act now"

## Email skeleton
Subject: a specific verb + the country detected
Body:
1. Cited public signal — one sentence, no flattery.
2. Why this typically becomes a compliance issue in 60–90 days.
3. One line of fit ("teams your size in your industry usually...").
4. Soft CTA.
5. Sign-off without a closing buzzword.
`,
}
