# CyberTech Intelligence — Trust Center & Social Signal Specification

## Public Trust Center
Create `/trust` as a first-class buyer-assurance experience with:
- Security
- Privacy
- Responsible AI / AI Usage
- Research methodology
- Editorial independence
- Threat-intelligence methodology
- Source provenance and freshness
- Data processing and retention
- Cookie / consent controls
- Vulnerability disclosure
- Availability / service status
- Subprocessors
- Compliance and certification mapping
- Accessibility
- Terms
- Security contact

Certification badges must render only when evidence proves CyberTech Intelligence holds the certification. ISC2, ISACA, CompTIA, GIAC/SANS and CSA content should be described as mappings or reference taxonomies unless an endorsement is explicitly evidenced.

## Social surfaces
Render only verified corporate profiles. Current integration slots:
- LinkedIn
- YouTube
- X
- Facebook
- RSS / newsletter
- Copy-link/share

Do not invent profile URLs. Until a profile is verified, keep that social button disabled or hidden.

## Signals
Emit first-party events for:
- social_outbound_click
- share_click
- copy_link
- newsletter_start / newsletter_submit
- trust_center_view
- trust_policy_view
- research_view
- threat_source_view
- threat_record_view
- vendor_search / vendor_filter
- pricing_view
- service_view
- faq_open
- chatbot_open / chatbot_answer
- form_start / form_submit / form_error
- call_click / booking_click
- webinar_registration / webinar_attendance
- report_download
- return_visit
- known_account_resolution
- verified_identity_resolution
- qualification_state_change

## Privacy boundary
Verified Identity is independent from Marketing Permission.
Never infer a person's identity without approved evidence.
Never infer sensitive traits.
Do not use covert fingerprinting as an identity substitute.
Persist consent state and evidence lineage with every identity or marketing-permission transition.
