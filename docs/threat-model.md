# Threat model

## Assets

1. The Anthropic API key (server-side only, in Netlify env vars).
2. The synthetic CRM fixture content (low value, but should not leak through model output).
3. The brand-voice doc (synthetic; treated as if it were real to model the right behavior).

## Trust boundaries

- **Browser → Netlify Functions:** untrusted input. Function validates JSON body shape and returns 400 on malformed payload.
- **Netlify Functions → api.anthropic.com:** outbound; key never logged. Errors are returned as plain text excerpts truncated to 400 chars to avoid leaking trace data.
- **Browser → static assets:** strict CSP `default-src 'self'`. No third-party scripts, fonts, or images. `connect-src 'self'` blocks any unauthorized exfil.

## Risks considered

| Risk | Mitigation |
|---|---|
| Key leakage via client bundle | Only the Netlify Function reads `ANTHROPIC_API_KEY`. The browser never receives it. Verified by `curl /api/health` returning the mode flag, not the key. |
| Prompt injection from "ingested" signal payloads | Signal text passes through the Function as user content but not as a tool that can side-effect. The model's only output channel is the structured `draft` JSON, which is rendered as text in the UI — no template execution. |
| Hallucinated CRM write-back | The HITL gate is the only path to writeback; it shows a JSON diff and requires explicit approval. The proposed `after` object is built deterministically client-side from the ICP score, not by the model. |
| Brand-safety failure | Evaluator checks every customer-visible string against a forbidden-terms list and a hallucination heuristic. Flagged drafts are blocked from approval (UI disables the approve button when the evaluator flags fail). |
| CSP bypass via inline scripts | Vite's production build inlines no scripts; `'unsafe-inline'` is allowed only for `style-src` (Vite-emitted style attributes). No event handlers in HTML. |
| Cookie or localStorage abuse | The app does not set any cookies or use localStorage. No tracking. |
| Third-party fonts / CDNs | None. All fonts are system stacks; all icons are inline SVG. |

## Data policy

All signals, companies, transcripts, and CRM payloads are **synthetic**. The repo contains no real PII. The `assets/sources.json` (kept under `src/data/sources.ts`) records the provenance of every fixture. Public-facing footers carry the disclaimer on every screen.

## Logs

Netlify Function logs include latency and status code only. The function intentionally does not log request bodies or model outputs.
