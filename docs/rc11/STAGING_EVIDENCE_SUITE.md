# RC11 Staging Evidence Suite

Status: executable checklist. A pass may only be recorded from observed staging evidence; configuration or source presence is not a pass.

## Release gate

Production release remains HOLD until all P0 checks pass and founder approval is recorded for production deployment.

## P0 runtime checks

1. `GET /` returns 2xx and renders the approved CTI experience without regression.
2. `GET /RC11_RUNTIME.js` returns 200 JavaScript with `RC11.1` runtime marker.
3. `GET /data/evidence-graph.json` returns 200 valid JSON and `schema=cti.evidence_graph.v1`.
4. Browser emits `rc11_runtime_ready` and `evidence_graph_loaded` without uncaught exceptions.
5. Verified LinkedIn link resolves to `https://www.linkedin.com/company/cybertechintelligence` and is tagged `data-evidence-id=evidence:linkedin` at runtime.
6. Signal Concierge lead submission sends `cti.website_lead.v1` to `/api/website-leads`.
7. Marketing permission is captured separately from identity verification state.
8. Browser qualification is explicitly advisory; server response is authoritative for CRM/SQL state.
9. `/api/website-leads` returns an expected non-5xx response for a valid staging payload; no PII is logged to browser console.
10. `/api/signals` is reachable if enabled and returns an expected non-5xx response.

## P0 regression checks

- Navigation, hero CTAs, resource cards, event flows, newsletter/signup and buyer journey remain functional.
- No new console errors or failed same-origin static assets.
- Mobile viewport 360x800 has no horizontal overflow.
- Desktop viewport 1440x900 has no clipped primary navigation or CTA.
- Keyboard navigation reaches primary CTA and forms; visible focus is retained.
- Forms have labels, errors and success state readable by assistive technology.

## Performance / discoverability

- Lighthouse mobile: Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 95.
- LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at p75 where field data exists; otherwise lab results are labelled as lab-only.
- Canonical, robots and sitemap behavior verified against staging policy; staging must not accidentally become indexable if it is intended to be private.

## Security / privacy

- HTTPS valid; no mixed content.
- Security headers reviewed: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy as applicable.
- No secrets/tokens embedded in shipped JavaScript.
- Consent state is not conflated with identity verification.
- Lead endpoint rejects malformed payloads and enforces server-side validation/rate controls.
- Evidence graph does not contain credentials, private customer data or unsupported claims.

## CRM / attribution trace

For one synthetic staging lead, capture evidence for:

`browser event -> website lead endpoint -> authoritative qualification -> CRM record/association -> attribution fields`

Record IDs may be stored in private test evidence, not committed to public source.

## Rollback

- Record pre-RC11 staging artifact/revision.
- Verify rollback procedure restores previous staging artifact.
- Rollback test must be observed before production readiness can be 10/10.

## Evidence record

For every check record: timestamp, environment URL, build SHA, observer/tool, result (PASS/FAIL/BLOCKED), and evidence reference.
