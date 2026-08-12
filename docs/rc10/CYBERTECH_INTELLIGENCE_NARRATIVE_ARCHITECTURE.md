# CyberTech Intelligence — Primary Narrative & GTM Architecture

## 1. Final brand-role architecture
CyberTech Intelligence owns cybersecurity intelligence, research, executive engagement, cybersecurity events and category authority.
It must not absorb Intent Amplify's horizontal demand-program positioning or SignalAtlas's cross-industry identity/attribution product role.

Core narrative:
**Cybersecurity buyer signals happen before leads do. CyberTech Intelligence turns observable first-party engagement and threat/category context into account intelligence, commercial action and measurable pipeline context.**

## 2. Final sitemap
- `/` — category narrative + signal-to-pipeline architecture
- `/services` — operator-led revenue-intelligence services
- `/pricing` — engagement models and scoping
- `/research` — cybersecurity revenue-intelligence briefs
- `/blog` — cybersecurity GTM commentary
- `/case-studies` — approved evidence only
- `/vendors` — vendor/category intelligence
- `/intelligence` — live threat-intelligence experience
- `/events` — executive webinars / roundtables / campaign events
- `/trust` — trust center
- `/contact` — GTM Intelligence Review
- `/privacy`, `/terms`, `/security`, `/.well-known/security.txt`
- `/api/*` — same-origin application APIs; not indexable

## 3. Page-by-page narrative
Home: problem → owned audience → signals → account context → activation → attribution.
Services: modular operator-led capabilities, full approved long-form narrative.
Pricing: diagnostic → activation build → fractional revenue intelligence; no invented price claims.
Research/Blog: authoritative cybersecurity market and GTM insight with provenance.
Vendors: category/vendor context grounded in actual records.
Intel: authoritative source feed + clearly labeled commercial interpretation.
Case Studies: only approved customer/outcome evidence.
Events: executive audience, topic, registration, attendance, follow-up signal path.
Trust: evidence for security/privacy/methodology/data-use concerns.
Contact: qualification-first GTM review and direct qualified-buyer route.

## 4. Demo architecture
Visitor journey:
source → page/topic engagement → anonymous session → account-context resolution → explicit identity → qualification → personalized research/demo path → CRM association → SDR/call/booking route → meeting/opportunity → attribution.

The demo should visibly separate:
Observed fact / Source / Interpretation / Commercial implication / Recommended next action.

## 5. Pricing architecture
Three engagement modes:
1. GTM Diagnostic — fixed-scope discovery / opportunity diagnosis.
2. Activation Build — system installation and operating model.
3. Fractional Revenue Intelligence — ongoing senior operating layer.
Do not add unsupported numerical outcomes or customer claims.

## 6. Conversion architecture
Primary CTA: Request GTM Intelligence Review.
Qualified intent CTA: Call / Book strategy conversation.
Research CTA: Explore research / intelligence.
Persistent CyberTech Signal Concierge routes visitor by explicit commercial context.
Server qualification is authoritative; browser scoring is advisory only.

## 7. Personalization requirements
Where legally/technically validated:
known account, verified identity, recent engagement, topic affinity, event interaction, buying-group context, qualification state, evidence lineage and attribution context.
No unsupported person-level identity inference.
Verified Identity != Marketing Permission.

## 8. Platform engineering handoff
- Same-origin content/vendor/threat/signals/leads APIs.
- Persistent signal IDs/session IDs and CRM correlation IDs.
- CMS with public admin controls disabled.
- Threat source registry with source-level health/freshness.
- Server-side qualification, dedupe and owner routing.
- Responsive layouts and device QA.
- canonical non-hash routes, robots, sitemap, llms.txt, JSON-LD.
- CDN/WAF/rate limiting/security headers.
- staging, rollback checkpoint and release evidence pack.

## 9. Governance handoff
Validate claims, source provenance, editorial separation, privacy/consent, identity resolution, marketing permission, threat interpretation, certification mappings, customer proof, cookies, social URLs, security/trust claims and launch controls.

## 10. Acceptance criteria
- No public API/CMS error strings.
- No unsupported numerical claims.
- No broken routes or CTA dead ends.
- No unverified social/trust badges.
- All signals produce stable event IDs and server acceptance.
- Qualified call/booking handoff passes server qualification.
- CRM dedupe/account/contact association verified.
- Threat feed source and freshness visible.
- Console/network free of unexplained blocking failures.
- Core Web Vitals and mobile QA pass.
- Search/LLM discovery files validate.
- Rollback procedure verified.

## 11. Critical blockers
Only blockers that stop production certification:
authoritative content/vendor data unavailable; CRM route not verified; consent/identity policy not implemented; threat feed unhealthy without graceful degradation; public security/privacy claims unsupported; production browser/network regression.

## 12. Delivery timeline & dependencies
RC10 code/config branch push: immediate once GitHub write works.
Staging integration: 0.5–1 engineering day assuming existing Hostinger runtime supports required APIs.
CRM/signal verification: 0.5–1 day after endpoint credentials/mappings are available.
Browser/device/security/search acceptance: 0.5 day.
Founder launch approval follows evidence pack; production cutover is separate.
