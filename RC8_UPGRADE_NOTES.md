# RC8 Conversion Layer

Non-destructive derivative of the finalized RC7 artifact.

Added:
- Global Buyer Concierge on every route.
- Deterministic commercial-intent qualification (no sensitive-trait inference).
- Qualified-buyer one-click call route to +1 602 898 6394.
- Booking CTA is feature-gated until an authoritative booking URL is configured.
- First-party interaction events target `/api/signals`.
- Homepage signal→action→pipeline execution bridge.
- No invented customer logos, review scores, pipeline outcomes, or case-study claims.

Backend gates:
- Recompute qualification server-side.
- Persist consent and signals server-side.
- Never treat the browser score as authoritative SQL status.
- Implement `/api/website-leads` and `/api/signals` before production certification.
