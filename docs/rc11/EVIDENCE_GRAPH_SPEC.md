# CTI Evidence Graph — RC11

## Principle
Every important assertion, observed signal, identity state, qualification decision and attributed outcome must be traceable to evidence. Facts, interpretations and recommendations are different node classes.

## Core nodes
- Evidence: evidence_id, type, source_uri/source_system, captured_at, valid_from, valid_to, freshness_sla, hash/version, owner, approval_status.
- Claim: claim_id, text, claim_type, materiality, status, approved_at, expires_at.
- Source: source_id, publisher/system, source_type, authority_class, health, last_success_at.
- Content: content_id, canonical_url, topic, category, published_at, updated_at.
- ThreatRecord: threat_id, source_id, observed_at, severity/source taxonomy, raw_reference.
- Organization: org_id, domain, account_resolution_status, resolution_evidence_id.
- Person: person_id, verified_identity_status, verification_evidence_id. Never create a verified identity from behavioral inference alone.
- Permission: permission_id, person_id, channel, purpose, status, evidence_id, timestamp.
- Session: session_id, anonymous/known-account/verified-person state.
- Event: event_id, session_id, event_type, occurred_at, page/content/topic, consent_state, evidence_id.
- BuyingGroup: group_id, org_id, explicit role evidence and confidence; inferred role must be labeled inference.
- Qualification: qualification_id, rule_version, inputs, decision, reason_codes, evidence_ids.
- CRMRecord: crm_ref, object_type, correlation_id, sync_state, last_sync_at.
- Opportunity/Outcome: outcome_id, CRM reference, stage/value only when supplied by authoritative CRM evidence.
- Recommendation: recommendation_id, generated_at, inputs/evidence_ids, recommendation_text, model/rule version, status.

## Edges
SUPPORTS: Evidence -> Claim
SOURCED_FROM: Evidence/ThreatRecord -> Source
PUBLISHED_AS: Evidence -> Content
OBSERVED_IN: Event -> Session
ENGAGED_WITH: Event -> Content/ThreatRecord
RESOLVES_TO_ACCOUNT: Session -> Organization (requires resolution evidence)
VERIFIES_IDENTITY: Evidence -> Person
GRANTS_PERMISSION: Evidence -> Permission
MEMBER_OF: Person -> BuyingGroup (explicit or labeled inference)
QUALIFIED_BY: Session/Organization/Person -> Qualification
SYNCED_TO: Qualification/Event/Person/Organization -> CRMRecord
INFLUENCED: Event/Content -> Opportunity/Outcome (attribution model/version required)
DERIVED_FROM: Recommendation -> Evidence/Event/Qualification
SUPERSEDES: Evidence/Claim -> prior version
CONTRADICTS: Evidence -> Claim/Evidence

## Evidence states
VERIFIED: authoritative source and freshness requirement met.
SUPPORTED: sufficient approved evidence but not primary/authoritative.
INFERRED: derived conclusion, visibly labeled.
STALE: evidence exceeded freshness SLA.
CONFLICTED: credible sources disagree.
UNKNOWN: no sufficient evidence.
QUARANTINED: failed validation, policy or integrity check.

## Serving rules
- Material factual claim: serve only VERIFIED or approved SUPPORTED.
- Customer/revenue/certification/security claim: VERIFIED + human approval required.
- Person identity: VERIFIED only.
- Marketing permission: active Permission node only; never inherited from identity.
- Interpretation/recommendation: may use VERIFIED/SUPPORTED evidence and must expose provenance IDs.
- STALE/CONFLICTED/UNKNOWN/QUARANTINED evidence cannot silently support a factual claim.

## API contract
GET /api/evidence/:id
GET /api/claims/:id/evidence
GET /api/content/:id/evidence
GET /api/account/:id/evidence-summary
POST /api/signals -> returns event_id + acceptance status
POST /api/qualification -> returns qualification_id + rule_version + reason_codes

All writes are authenticated server-side, schema validated, rate limited and logged. Public clients receive only fields explicitly classified for public display.

## UI contract
Every evidence-aware module can expose:
- Verified/Supported/Inferred/Unknown state
- source
- captured/published timestamp
- freshness
- evidence lineage
- interpretation
- recommended action

This makes trust inspectable rather than decorative.
